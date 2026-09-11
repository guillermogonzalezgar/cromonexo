-- Aplica la tarifa de envío según el precio del cromo y permite confirmar cartas sin seguimiento.
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
  shipping := case when p_delivery_method='pickup' then 0 when listing.price_cents>500 then 399 else 149 end;
  fee := greatest(10,round(listing.price_cents*0.05)::integer);
  insert into public.market_orders(request_id,listing_id,buyer_id,seller_id,item_cents,shipping_cents,platform_fee_cents,delivery_method,stripe_checkout_session_id)
  values(target.id,listing.id,target.buyer_id,listing.seller_id,listing.price_cents,shipping,fee,p_delivery_method::public.market_delivery_method,p_checkout_session_id)
  on conflict(request_id) do update set stripe_checkout_session_id=excluded.stripe_checkout_session_id,delivery_method=excluded.delivery_method,shipping_cents=excluded.shipping_cents,updated_at=now()
  where public.market_orders.payment_status='pending'
  returning id into order_id;
  if order_id is null then raise exception 'order already processed'; end if;
  return order_id;
end $$;

create or replace function public.ship_market_order(p_order_id uuid,p_carrier text,p_tracking_code text)
returns void language plpgsql security definer set search_path='' as $$
begin
  update public.market_orders
  set carrier=case when shipping_cents>149 then left(trim(p_carrier),80) else 'Correos' end,
      tracking_code=case when shipping_cents>149 then left(trim(p_tracking_code),120) else null end,
      shipped_at=now(),updated_at=now()
  where id=p_order_id and seller_id=auth.uid() and payment_status='paid' and delivery_method='shipping' and shipped_at is null
    and (shipping_cents<=149 or (length(trim(p_carrier))>1 and length(trim(p_tracking_code))>2));
  if not found then raise exception 'order unavailable'; end if;
end $$;
