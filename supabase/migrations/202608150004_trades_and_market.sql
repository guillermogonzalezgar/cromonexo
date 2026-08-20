-- Propuestas atómicas y mercado de anuncios (sin pagos ni envíos).
create type public.market_listing_status as enum ('active', 'sold', 'withdrawn');
create type public.market_request_status as enum ('pending', 'accepted', 'rejected', 'cancelled');

create table public.market_listings (
  id uuid primary key default gen_random_uuid(), seller_id uuid not null references public.profiles(id) on delete cascade,
  sticker_id uuid not null references public.stickers(id) on delete cascade, quantity integer not null default 1 check (quantity >= 1),
  price_cents integer not null check (price_cents between 1 and 100000), status public.market_listing_status not null default 'active',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.market_requests (
  id uuid primary key default gen_random_uuid(), listing_id uuid not null references public.market_listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade, status public.market_request_status not null default 'pending',
  message text check (message is null or length(message) <= 300), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (listing_id, buyer_id)
);
create index market_listings_active_idx on public.market_listings (status, created_at desc);
create index market_requests_parties_idx on public.market_requests (buyer_id, status);
alter table public.market_listings enable row level security;
alter table public.market_requests enable row level security;
create policy "authenticated view active or own listings" on public.market_listings for select to authenticated using (status = 'active' or seller_id = (select auth.uid()));
create policy "participants view market requests" on public.market_requests for select to authenticated using (buyer_id = (select auth.uid()) or exists (select 1 from public.market_listings l where l.id = listing_id and l.seller_id = (select auth.uid())));
drop policy if exists "participants update proposals" on public.trade_proposals;
drop policy if exists "proposer manages trade items" on public.trade_items;

create or replace function public.create_trade_proposal(p_recipient_id uuid, p_collection_id uuid, p_offered uuid[], p_requested uuid[], p_message text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare proposal_id uuid; current_user_id uuid := auth.uid();
begin
  if current_user_id is null or current_user_id = p_recipient_id or cardinality(p_offered) = 0 or cardinality(p_requested) = 0 then raise exception 'invalid proposal'; end if;
  if exists (select 1 from unnest(p_offered) x(id) where not exists (select 1 from public.user_stickers u join public.stickers s on s.id=u.sticker_id where u.user_id=current_user_id and u.sticker_id=x.id and u.status='duplicate' and s.collection_id=p_collection_id)) then raise exception 'invalid offered stickers'; end if;
  if exists (select 1 from unnest(p_requested) x(id) where not exists (select 1 from public.user_stickers u join public.stickers s on s.id=u.sticker_id where u.user_id=p_recipient_id and u.sticker_id=x.id and u.status='duplicate' and s.collection_id=p_collection_id)) then raise exception 'invalid requested stickers'; end if;
  insert into public.trade_proposals(collection_id, proposer_id, recipient_id, message) values(p_collection_id,current_user_id,p_recipient_id,left(p_message,500)) returning id into proposal_id;
  insert into public.trade_items(trade_proposal_id,sticker_id,direction) select proposal_id,id,'offered' from unnest(p_offered) id;
  insert into public.trade_items(trade_proposal_id,sticker_id,direction) select proposal_id,id,'requested' from unnest(p_requested) id;
  return proposal_id;
end $$;

create or replace function public.respond_trade_proposal(p_proposal_id uuid, p_response public.trade_status)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_response not in ('accepted','rejected') then raise exception 'invalid response'; end if;
  update public.trade_proposals set status=p_response, responded_at=now(), updated_at=now()
  where id=p_proposal_id and recipient_id=auth.uid() and status='pending';
  if not found then raise exception 'proposal unavailable'; end if;
end $$;

create or replace function public.create_market_listing(p_sticker_id uuid, p_price_cents integer)
returns uuid language plpgsql security definer set search_path = '' as $$
declare listing_id uuid;
begin
  if p_price_cents not between 1 and 100000 or not exists(select 1 from public.user_stickers where user_id=auth.uid() and sticker_id=p_sticker_id and status='duplicate') then raise exception 'invalid listing'; end if;
  insert into public.market_listings(seller_id,sticker_id,price_cents) values(auth.uid(),p_sticker_id,p_price_cents) returning id into listing_id;
  return listing_id;
end $$;

create or replace function public.request_market_purchase(p_listing_id uuid, p_message text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare request_id uuid;
begin
  if not exists(select 1 from public.market_listings where id=p_listing_id and status='active' and seller_id<>auth.uid()) then raise exception 'listing unavailable'; end if;
  insert into public.market_requests(listing_id,buyer_id,message) values(p_listing_id,auth.uid(),left(p_message,300))
  on conflict(listing_id,buyer_id) do update set status='pending',message=excluded.message,updated_at=now() returning id into request_id;
  return request_id;
end $$;

create or replace function public.respond_market_request(p_request_id uuid, p_response public.market_request_status)
returns void language plpgsql security definer set search_path = '' as $$
declare target_listing uuid;
begin
  if p_response not in ('accepted','rejected') then raise exception 'invalid response'; end if;
  select r.listing_id into target_listing from public.market_requests r join public.market_listings l on l.id=r.listing_id
  where r.id=p_request_id and r.status='pending' and l.seller_id=auth.uid() and l.status='active';
  if target_listing is null then raise exception 'request unavailable'; end if;
  update public.market_requests set status=p_response,updated_at=now() where id=p_request_id;
  if p_response='accepted' then
    update public.market_listings set status='sold',updated_at=now() where id=target_listing;
    update public.market_requests set status='rejected',updated_at=now() where listing_id=target_listing and id<>p_request_id and status='pending';
  end if;
end $$;

revoke all on function public.create_trade_proposal(uuid,uuid,uuid[],uuid[],text) from public, anon;
revoke all on function public.respond_trade_proposal(uuid,public.trade_status) from public, anon;
revoke all on function public.create_market_listing(uuid,integer) from public, anon;
revoke all on function public.request_market_purchase(uuid,text) from public, anon;
revoke all on function public.respond_market_request(uuid,public.market_request_status) from public, anon;
grant execute on function public.create_trade_proposal(uuid,uuid,uuid[],uuid[],text) to authenticated;
grant execute on function public.respond_trade_proposal(uuid,public.trade_status) to authenticated;
grant execute on function public.create_market_listing(uuid,integer) to authenticated;
grant execute on function public.request_market_purchase(uuid,text) to authenticated;
grant execute on function public.respond_market_request(uuid,public.market_request_status) to authenticated;
