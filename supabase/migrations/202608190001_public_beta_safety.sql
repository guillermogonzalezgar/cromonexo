-- Preparación de la beta pública: lista de espera y denuncias del mercado.
create type public.report_reason as enum ('fraud', 'prohibited', 'misleading', 'harassment', 'other');

create table public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  display_name text,
  city text,
  collection_interest text not null default 'LALIGA ESTE 2026/27',
  privacy_accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint waitlist_email_format check (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  constraint waitlist_email_length check (length(email) <= 254),
  constraint waitlist_name_length check (display_name is null or length(display_name) <= 80),
  constraint waitlist_city_length check (city is null or length(city) <= 80)
);
create unique index waitlist_email_unique_idx on public.waitlist_entries (lower(email));

create table public.market_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.market_listings(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason public.report_reason not null,
  details text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint market_report_details_length check (details is null or length(details) <= 500),
  unique (listing_id, reporter_id)
);
create index market_reports_pending_idx on public.market_reports (reviewed_at, created_at);

alter table public.waitlist_entries enable row level security;
alter table public.market_reports enable row level security;

-- La lista pública solo admite altas; los visitantes nunca pueden leer correos.
create policy "public joins waitlist" on public.waitlist_entries
  for insert to anon, authenticated with check (true);
revoke select, update, delete on public.waitlist_entries from anon, authenticated;
grant insert on public.waitlist_entries to anon, authenticated;

create policy "users view own reports" on public.market_reports
  for select to authenticated using (reporter_id = (select auth.uid()));

create or replace function public.report_market_listing(
  p_listing_id uuid,
  p_reason public.report_reason,
  p_details text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare report_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not exists (
    select 1 from public.market_listings
    where id = p_listing_id and seller_id <> auth.uid()
  ) then raise exception 'listing unavailable'; end if;

  insert into public.market_reports (listing_id, reporter_id, reason, details)
  values (p_listing_id, auth.uid(), p_reason, nullif(left(trim(p_details), 500), ''))
  on conflict (listing_id, reporter_id)
  do update set reason = excluded.reason, details = excluded.details, created_at = now(), reviewed_at = null
  returning id into report_id;
  return report_id;
end $$;

revoke all on function public.report_market_listing(uuid, public.report_reason, text) from public, anon;
grant execute on function public.report_market_listing(uuid, public.report_reason, text) to authenticated;
