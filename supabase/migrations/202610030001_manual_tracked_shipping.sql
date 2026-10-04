-- Apply before publishing the matching checkout. Existing orders stay unchanged.
begin;

create or replace function public.is_shipping_administrator()
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from auth.users where id=auth.uid() and lower(email)='comunicacion@cromonexo.com' and email_confirmed_at is not null);
$$;
revoke all on function public.is_shipping_administrator() from public,anon;
grant execute on function public.is_shipping_administrator() to authenticated,service_role;

alter table public.market_orders add column if not exists shipping_managed_by_platform boolean not null default false;

drop policy if exists "shipping administrator reads managed orders" on public.market_orders;
create policy "shipping administrator reads managed orders" on public.market_orders for select to authenticated
using(shipping_managed_by_platform and public.is_shipping_administrator());

create table if not exists public.market_shipping_details (
  order_id uuid primary key references public.market_orders(id) on delete cascade,
  sender jsonb,
  label_path text,
  updated_at timestamptz not null default now()
);
alter table public.market_shipping_details enable row level security;
revoke all on public.market_shipping_details from anon, authenticated;
grant select on public.market_shipping_details to authenticated;
grant all on public.market_shipping_details to service_role;
drop policy if exists "seller reads own shipping details" on public.market_shipping_details;
create policy "seller reads own shipping details" on public.market_shipping_details for select to authenticated
using (exists(select 1 from public.market_orders o where o.id=order_id and (o.seller_id=auth.uid() or public.is_shipping_administrator())));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('market-shipping-labels','market-shipping-labels',false,4194304,array['application/pdf'])
on conflict(id) do update set public=false,file_size_limit=4194304,allowed_mime_types=array['application/pdf'];
-- Private PDF objects: only the verified owner uploads, and the seller downloads.
drop policy if exists "shipping administrator uploads labels" on storage.objects;
create policy "shipping administrator uploads labels" on storage.objects for insert to authenticated
with check(bucket_id='market-shipping-labels' and public.is_shipping_administrator() and exists(select 1 from public.market_orders o where o.id::text=(storage.foldername(name))[1] and o.shipping_managed_by_platform and o.payment_status='paid'));
drop policy if exists "shipping participants read labels" on storage.objects;
create policy "shipping participants read labels" on storage.objects for select to authenticated
using(bucket_id='market-shipping-labels' and exists(select 1 from public.market_orders o where o.id::text=(storage.foldername(name))[1] and o.payment_status='paid' and (o.seller_id=auth.uid() or public.is_shipping_administrator())));
drop policy if exists "shipping administrator removes labels" on storage.objects;
create policy "shipping administrator removes labels" on storage.objects for delete to authenticated
using(bucket_id='market-shipping-labels' and public.is_shipping_administrator());

create or replace function public.create_market_order_v3(p_request_id uuid,p_delivery_method text,p_checkout_session_id text,p_livemode boolean)
returns uuid language plpgsql security definer set search_path='' as $$
declare target public.market_requests%rowtype; listing public.market_listings%rowtype; order_id uuid; shipping integer; fee integer; managed boolean;
begin
  if auth.uid() is null or p_delivery_method is null or p_delivery_method not in ('shipping','pickup') or p_checkout_session_id is null or p_checkout_session_id not like 'cs_%' or p_livemode is null then raise exception 'invalid order'; end if;
  select * into target from public.market_requests where id=p_request_id and buyer_id=auth.uid() and status='accepted' for update;
  if not found then raise exception 'accepted request required'; end if;
  select * into listing from public.market_listings where id=target.listing_id and status='sold';
  if not found then raise exception 'listing unavailable'; end if;
  if not exists(select 1 from public.payment_accounts where user_id=listing.seller_id and livemode=p_livemode and charges_enabled and payouts_enabled) then raise exception 'seller payments unavailable'; end if;
  shipping := case when p_delivery_method='pickup' then 0 when listing.price_cents>500 then 399 else 149 end;
  fee := greatest(10,round(listing.price_cents::numeric/20)::integer);
  managed := p_delivery_method='shipping' and listing.price_cents>500;
  insert into public.market_orders(request_id,listing_id,buyer_id,seller_id,item_cents,shipping_cents,platform_fee_cents,delivery_method,stripe_checkout_session_id,shipping_managed_by_platform)
  values(target.id,listing.id,target.buyer_id,listing.seller_id,listing.price_cents,shipping,fee,p_delivery_method::public.market_delivery_method,p_checkout_session_id,managed)
  on conflict(request_id) do update set stripe_checkout_session_id=excluded.stripe_checkout_session_id,delivery_method=excluded.delivery_method,shipping_cents=excluded.shipping_cents,item_cents=excluded.item_cents,platform_fee_cents=excluded.platform_fee_cents,shipping_managed_by_platform=excluded.shipping_managed_by_platform,updated_at=now()
  where public.market_orders.payment_status='pending'
  returning id into order_id;
  if order_id is null then raise exception 'order already processed'; end if;
  return order_id;
end $$;
revoke all on function public.create_market_order_v3(uuid,text,text,boolean) from public,anon;
grant execute on function public.create_market_order_v3(uuid,text,text,boolean) to authenticated;

create or replace function public.ship_market_order(p_order_id uuid,p_carrier text,p_tracking_code text)
returns void language plpgsql security definer set search_path='' as $$
begin
  update public.market_orders o
  set carrier=case when o.shipping_managed_by_platform then o.carrier when o.shipping_cents>149 then left(trim(p_carrier),80) else 'Correos' end,
      tracking_code=case when o.shipping_managed_by_platform then o.tracking_code when o.shipping_cents>149 then left(trim(p_tracking_code),120) else null end,
      shipped_at=now(),updated_at=now()
  where o.id=p_order_id and o.seller_id=auth.uid() and o.payment_status='paid' and o.delivery_method='shipping' and o.shipped_at is null
    and (case when o.shipping_managed_by_platform then o.tracking_code is not null and exists(select 1 from public.market_shipping_details d where d.order_id=o.id and d.label_path is not null)
         else o.shipping_cents<=149 or (length(trim(p_carrier))>1 and length(trim(p_tracking_code))>2) end);
  if not found then raise exception 'order unavailable'; end if;
end $$;

-- RPCs enforce seller/admin identity independently of the web endpoints.
create or replace function public.save_managed_shipping_sender(p_order_id uuid,p_seller_id uuid,p_sender jsonb)
returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or p_seller_id is distinct from auth.uid() then raise exception 'forbidden'; end if;
  if p_sender is null or jsonb_typeof(p_sender)<>'object' or not (p_sender ?& array['name','address','postalCode','city','phone']) or octet_length(p_sender::text)>2000 then raise exception 'invalid sender'; end if;
  if length(trim(p_sender->>'name')) not between 2 and 120 or length(trim(p_sender->>'address')) not between 5 and 200 or length(trim(p_sender->>'city')) not between 2 and 100 or (p_sender->>'postalCode') !~ '^[0-9]{5}$' or (p_sender->>'phone') !~ '^[+]?[0-9 ()-]{9,20}$' then raise exception 'invalid sender'; end if;
  perform 1 from public.market_orders where id=p_order_id and seller_id=p_seller_id and shipping_managed_by_platform and payment_status='paid' and shipped_at is null and tracking_code is null for update;
  if not found then raise exception 'order unavailable'; end if;
  insert into public.market_shipping_details(order_id,sender) values(p_order_id,p_sender)
  on conflict(order_id) do update set sender=excluded.sender,updated_at=now();
end $$;
revoke all on function public.save_managed_shipping_sender(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.save_managed_shipping_sender(uuid,uuid,jsonb) to authenticated;

create or replace function public.register_managed_shipping_label(p_order_id uuid,p_tracking text,p_label_path text)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.is_shipping_administrator() then raise exception 'forbidden'; end if;
  if p_tracking is null or p_tracking !~ '^[a-zA-Z0-9-]{5,80}$' or p_label_path is null or split_part(p_label_path,'/',1)<>p_order_id::text then raise exception 'invalid label'; end if;
  if not exists(select 1 from storage.objects where bucket_id='market-shipping-labels' and name=p_label_path) then raise exception 'label missing'; end if;
  perform 1 from public.market_orders where id=p_order_id and shipping_managed_by_platform and payment_status='paid' and shipped_at is null and received_at is null for update;
  if not found then raise exception 'order unavailable'; end if;
  update public.market_shipping_details set label_path=p_label_path,updated_at=now() where order_id=p_order_id and sender is not null;
  if not found then raise exception 'sender missing'; end if;
  update public.market_orders set carrier='Correos',tracking_code=p_tracking,updated_at=now() where id=p_order_id;
  -- Label purchase is not dispatch: the seller confirms actual handover later.
end $$;
revoke all on function public.register_managed_shipping_label(uuid,text,text) from public,anon,authenticated;
grant execute on function public.register_managed_shipping_label(uuid,text,text) to authenticated;

create or replace function public.managed_shipping_seller_email(p_order_id uuid)
returns text language plpgsql stable security definer set search_path='' as $$
declare result text;
begin
  if not public.is_shipping_administrator() then raise exception 'forbidden'; end if;
  select u.email into result from public.market_orders o join auth.users u on u.id=o.seller_id where o.id=p_order_id and o.shipping_managed_by_platform and o.payment_status='paid';
  return result;
end $$;
revoke all on function public.managed_shipping_seller_email(uuid) from public,anon;
grant execute on function public.managed_shipping_seller_email(uuid) to authenticated;

commit;
