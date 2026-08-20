-- CromoSwap MVP — schema, integrity rules, indexes and RLS
create extension if not exists pgcrypto;
create type public.sticker_status as enum ('wanted', 'duplicate');
create type public.trade_status as enum ('pending', 'accepted', 'rejected', 'countered', 'cancelled');
create type public.trade_item_direction as enum ('offered', 'requested');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique check (username is null or length(username) between 3 and 30),
  display_name text check (display_name is null or length(display_name) <= 80),
  city text check (city is null or length(city) <= 80),
  avatar_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.collections (
  id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null,
  season text, publisher text, total_stickers integer check (total_stickers > 0), is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.stickers (
  id uuid primary key default gen_random_uuid(), collection_id uuid not null references public.collections(id) on delete cascade,
  number text not null check (length(number) between 1 and 20), name text, team text not null, category text, created_at timestamptz not null default now(),
  unique (collection_id, number, team)
);
create table public.user_stickers (
  user_id uuid not null references public.profiles(id) on delete cascade,
  sticker_id uuid not null references public.stickers(id) on delete cascade,
  status public.sticker_status not null, quantity integer not null default 1 check (quantity >= 1),
  updated_at timestamptz not null default now(), primary key (user_id, sticker_id),
  constraint duplicate_quantity check (status <> 'duplicate' or quantity >= 2)
);
create table public.trade_proposals (
  id uuid primary key default gen_random_uuid(), collection_id uuid not null references public.collections(id),
  proposer_id uuid not null references public.profiles(id), recipient_id uuid not null references public.profiles(id),
  parent_proposal_id uuid references public.trade_proposals(id), status public.trade_status not null default 'pending',
  message text check (message is null or length(message) <= 500), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  responded_at timestamptz, check (proposer_id <> recipient_id)
);
create table public.trade_items (
  id uuid primary key default gen_random_uuid(), trade_proposal_id uuid not null references public.trade_proposals(id) on delete cascade,
  sticker_id uuid not null references public.stickers(id), direction public.trade_item_direction not null, quantity integer not null default 1 check (quantity >= 1),
  unique (trade_proposal_id, sticker_id, direction)
);
create index user_stickers_status_idx on public.user_stickers (user_id, status);
create index user_stickers_matching_idx on public.user_stickers (sticker_id, status, user_id);
create index trade_participants_idx on public.trade_proposals (recipient_id, proposer_id, status);

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.profiles (id, username, display_name) values (new.id, null, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.collections enable row level security;
alter table public.stickers enable row level security;
alter table public.user_stickers enable row level security;
alter table public.trade_proposals enable row level security;
alter table public.trade_items enable row level security;

create policy "authenticated can view profiles" on public.profiles for select to authenticated using (true);
create policy "users update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "authenticated view active collections" on public.collections for select to authenticated using (is_active);
create policy "authenticated view stickers" on public.stickers for select to authenticated using (exists (select 1 from public.collections c where c.id = collection_id and c.is_active));
create policy "users view own stickers" on public.user_stickers for select to authenticated using ((select auth.uid()) = user_id);
create policy "users insert own stickers" on public.user_stickers for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "users update own stickers" on public.user_stickers for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users delete own stickers" on public.user_stickers for delete to authenticated using ((select auth.uid()) = user_id);
create policy "participants view proposals" on public.trade_proposals for select to authenticated using ((select auth.uid()) in (proposer_id, recipient_id));
create policy "users create proposals" on public.trade_proposals for insert to authenticated with check ((select auth.uid()) = proposer_id and status = 'pending');
create policy "participants update proposals" on public.trade_proposals for update to authenticated using ((select auth.uid()) in (proposer_id, recipient_id)) with check ((select auth.uid()) in (proposer_id, recipient_id));
create policy "participants view trade items" on public.trade_items for select to authenticated using (exists (select 1 from public.trade_proposals p where p.id = trade_proposal_id and (select auth.uid()) in (p.proposer_id, p.recipient_id)));
create policy "proposer manages trade items" on public.trade_items for all to authenticated using (exists (select 1 from public.trade_proposals p where p.id = trade_proposal_id and p.proposer_id = (select auth.uid()) and p.status = 'pending')) with check (exists (select 1 from public.trade_proposals p where p.id = trade_proposal_id and p.proposer_id = (select auth.uid()) and p.status = 'pending'));

-- El matching se añadirá como RPC security-definer en su propia migración.
-- Así no abrimos SELECT sobre los inventarios de otros usuarios para el cliente.
