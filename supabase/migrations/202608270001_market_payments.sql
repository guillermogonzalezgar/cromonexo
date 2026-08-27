-- Stripe Connect y pedidos de mercado en modo de prueba.
create type public.market_delivery_method as enum ('shipping', 'pickup');
create type public.market_payment_status as enum ('pending', 'paid', 'failed', 'refunded');

create table public.payment_accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  stripe_account_id text not null unique check (stripe_account_id ~ '^acct_'),
  onboarding_complete boolean not null default false,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.market_orders (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.market_requests(id) on delete restrict,
  listing_id uuid not null references public.market_listings(id) on delete restrict,
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  seller_id uuid not null references public.profiles(id) on delete restrict,
  item_cents integer not null check (item_cents between 1 and 100000),
  shipping_cents integer not null check (shipping_cents between 0 and 10000),
  platform_fee_cents integer not null check (platform_fee_cents >= 10),
  total_cents integer generated always as (item_cents + shipping_cents) stored,
  delivery_method public.market_delivery_method not null,
  payment_status public.market_payment_status not null default 'pending',
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  carrier text,
  tracking_code text,
  shipped_at timestamptz,
  received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payment_accounts enable row level security;
alter table public.market_orders enable row level security;
create policy "users view own payment account" on public.payment_accounts for select to authenticated using (user_id=auth.uid());
create policy "accepted buyers view seller payment account" on public.payment_accounts for select to authenticated using (
  exists (
    select 1 from public.market_requests request
    join public.market_listings listing on listing.id=request.listing_id
    where request.buyer_id=auth.uid() and request.status='accepted' and listing.seller_id=payment_accounts.user_id
  )
);
create policy "participants view market orders" on public.market_orders for select to authenticated using (buyer_id=auth.uid() or seller_id=auth.uid());

create or replace function public.save_payment_account(p_stripe_account_id text)
returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or p_stripe_account_id !~ '^acct_' then raise exception 'invalid account'; end if;
  insert into public.payment_accounts(user_id,stripe_account_id)
  values(auth.uid(),p_stripe_account_id)
  on conflict(user_id) do update set stripe_account_id=excluded.stripe_account_id,updated_at=now();
end $$;

create or replace function public.update_payment_account_status(p_charges boolean,p_payouts boolean,p_complete boolean)
returns void language plpgsql security definer set search_path='' as $$
begin
  update public.payment_accounts set charges_enabled=p_charges,payouts_enabled=p_payouts,onboarding_complete=p_complete,updated_at=now()
  where user_id=auth.uid();
  if not found then raise exception 'payment account missing'; end if;
end $$;

create or replace function public.create_market_order(p_request_id uuid,p_delivery_method text,p_checkout_session_id text)
returns uuid language plpgsql security definer set search_path='' as $$
declare target public.market_requests%rowtype; listing public.market_listings%rowtype; order_id uuid; shipping integer; fee integer;
begin
  if auth.uid() is null or p_delivery_method not in ('shipping','pickup') or p_checkout_session_id not like 'cs_%' then raise exception 'invalid order'; end if;
  select * into target from public.market_requests where id=p_request_id and buyer_id=auth.uid() and status='accepted';
  if not found then raise exception 'accepted request required'; end if;
  select * into listing from public.market_listings where id=target.listing_id and status='sold';
  if not found then raise exception 'listing unavailable'; end if;
  if not exists(select 1 from public.payment_accounts where user_id=listing.seller_id and charges_enabled and payouts_enabled) then raise exception 'seller payments unavailable'; end if;
  shipping := case when p_delivery_method='shipping' then 399 else 0 end;
  fee := greatest(10,round(listing.price_cents*0.05)::integer);
  insert into public.market_orders(request_id,listing_id,buyer_id,seller_id,item_cents,shipping_cents,platform_fee_cents,delivery_method,stripe_checkout_session_id)
  values(target.id,listing.id,target.buyer_id,listing.seller_id,listing.price_cents,shipping,fee,p_delivery_method::public.market_delivery_method,p_checkout_session_id)
  on conflict(request_id) do update set stripe_checkout_session_id=excluded.stripe_checkout_session_id,delivery_method=excluded.delivery_method,shipping_cents=excluded.shipping_cents,updated_at=now()
  where public.market_orders.payment_status='pending'
  returning id into order_id;
  if order_id is null then raise exception 'order already processed'; end if;
  return order_id;
end $$;

create or replace function public.confirm_market_order_payment(p_checkout_session_id text,p_payment_intent_id text)
returns void language plpgsql security definer set search_path='' as $$
begin
  update public.market_orders set payment_status='paid',stripe_payment_intent_id=p_payment_intent_id,updated_at=now()
  where stripe_checkout_session_id=p_checkout_session_id and buyer_id=auth.uid() and payment_status='pending';
  if not found then raise exception 'order unavailable'; end if;
end $$;

create or replace function public.ship_market_order(p_order_id uuid,p_carrier text,p_tracking_code text)
returns void language plpgsql security definer set search_path='' as $$
begin
  update public.market_orders set carrier=left(trim(p_carrier),80),tracking_code=left(trim(p_tracking_code),120),shipped_at=now(),updated_at=now()
  where id=p_order_id and seller_id=auth.uid() and payment_status='paid' and delivery_method='shipping' and shipped_at is null
    and length(trim(p_carrier))>1 and length(trim(p_tracking_code))>2;
  if not found then raise exception 'order unavailable'; end if;
end $$;

create or replace function public.receive_market_order(p_order_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  update public.market_orders set received_at=now(),updated_at=now()
  where id=p_order_id and buyer_id=auth.uid() and payment_status='paid' and received_at is null
    and (delivery_method='pickup' or shipped_at is not null);
  if not found then raise exception 'order unavailable'; end if;
end $$;

revoke all on function public.save_payment_account(text) from public,anon;
revoke all on function public.update_payment_account_status(boolean,boolean,boolean) from public,anon;
revoke all on function public.create_market_order(uuid,text,text) from public,anon;
revoke all on function public.confirm_market_order_payment(text,text) from public,anon;
revoke all on function public.ship_market_order(uuid,text,text) from public,anon;
revoke all on function public.receive_market_order(uuid) from public,anon;
grant execute on function public.save_payment_account(text) to authenticated;
grant execute on function public.update_payment_account_status(boolean,boolean,boolean) to authenticated;
grant execute on function public.create_market_order(uuid,text,text) to authenticated;
grant execute on function public.confirm_market_order_payment(text,text) to authenticated;
grant execute on function public.ship_market_order(uuid,text,text) to authenticated;
grant execute on function public.receive_market_order(uuid) to authenticated;
