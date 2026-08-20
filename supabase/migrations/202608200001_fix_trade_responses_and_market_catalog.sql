-- Evita ambigüedades de PostgREST con parámetros enum al responder propuestas.
drop function if exists public.respond_trade_proposal(uuid, public.trade_status);

create function public.respond_trade_proposal(p_proposal_id uuid, p_response text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if p_response not in ('accepted', 'rejected') then raise exception 'invalid response'; end if;

  update public.trade_proposals
  set status = p_response::public.trade_status, responded_at = now(), updated_at = now()
  where id = p_proposal_id
    and recipient_id = auth.uid()
    and status = 'pending';

  if not found then raise exception 'proposal unavailable'; end if;
end $$;

revoke all on function public.respond_trade_proposal(uuid, text) from public, anon;
grant execute on function public.respond_trade_proposal(uuid, text) to authenticated;

-- Un anuncio puede corresponder a cualquier cromo real del catálogo.
-- El usuario confirma en la interfaz que posee físicamente el ejemplar ofrecido.
create or replace function public.create_market_listing(p_sticker_id uuid, p_price_cents integer)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare listing_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if p_price_cents not between 1 and 100000 then raise exception 'invalid price'; end if;
  if not exists (
    select 1
    from public.stickers s
    join public.collections c on c.id = s.collection_id
    where s.id = p_sticker_id and c.is_active
  ) then raise exception 'invalid sticker'; end if;

  insert into public.market_listings(seller_id, sticker_id, price_cents)
  values(auth.uid(), p_sticker_id, p_price_cents)
  returning id into listing_id;
  return listing_id;
end $$;

revoke all on function public.create_market_listing(uuid, integer) from public, anon;
grant execute on function public.create_market_listing(uuid, integer) to authenticated;
