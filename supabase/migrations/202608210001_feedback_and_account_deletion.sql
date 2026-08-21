-- Opiniones de usuarios y eliminación autoservicio de cuenta.
create type public.feedback_kind as enum ('problem', 'suggestion', 'other');

create table public.feedback_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind public.feedback_kind not null,
  message text not null check (length(trim(message)) between 10 and 1500),
  page_url text check (page_url is null or length(page_url) <= 500),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index feedback_messages_user_idx on public.feedback_messages (user_id, created_at desc);
alter table public.feedback_messages enable row level security;

create policy "users create feedback" on public.feedback_messages
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "users view own feedback" on public.feedback_messages
  for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'authentication required'; end if;

  delete from public.trade_proposals
  where proposer_id = current_user_id or recipient_id = current_user_id;
  delete from auth.users where id = current_user_id;

  if not found then raise exception 'account unavailable'; end if;
end $$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

create table public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('fraud', 'harassment', 'spam', 'other')),
  details text check (details is null or length(details) <= 500),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (reporter_id, reported_id),
  check (reporter_id <> reported_id)
);

alter table public.user_blocks enable row level security;
alter table public.user_reports enable row level security;
create policy "users manage own blocks" on public.user_blocks for all to authenticated
  using (blocker_id = (select auth.uid())) with check (blocker_id = (select auth.uid()));
create policy "users view own reports" on public.user_reports for select to authenticated
  using (reporter_id = (select auth.uid()));

create or replace function public.report_user(p_reported_id uuid, p_reason text, p_details text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare report_id uuid;
begin
  if auth.uid() is null or p_reported_id = auth.uid() then raise exception 'invalid report'; end if;
  if p_reason not in ('fraud', 'harassment', 'spam', 'other') then raise exception 'invalid reason'; end if;
  insert into public.user_reports (reporter_id, reported_id, reason, details)
  values (auth.uid(), p_reported_id, p_reason, nullif(left(trim(p_details), 500), ''))
  on conflict (reporter_id, reported_id) do update
  set reason = excluded.reason, details = excluded.details, created_at = now(), reviewed_at = null
  returning id into report_id;
  return report_id;
end $$;

create or replace function public.block_user(p_blocked_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or p_blocked_id = auth.uid() then raise exception 'invalid block'; end if;
  insert into public.user_blocks (blocker_id, blocked_id) values (auth.uid(), p_blocked_id)
  on conflict do nothing;
end $$;

revoke all on function public.report_user(uuid, text, text) from public, anon;
revoke all on function public.block_user(uuid) from public, anon;
grant execute on function public.report_user(uuid, text, text) to authenticated;
grant execute on function public.block_user(uuid) to authenticated;

create or replace function public.get_user_matches(p_collection_id uuid)
returns table (
  matched_user_id uuid, username text, display_name text, city text,
  can_receive uuid[], can_give uuid[], receive_count bigint, give_count bigint,
  compatibility_score bigint
)
language sql stable security definer set search_path = '' as $$
  with compatible_items as (
    select theirs.user_id as matched_user_id, mine.sticker_id,
      case when mine.status = 'wanted' and theirs.status = 'duplicate' then 'receive'
           when mine.status = 'duplicate' and theirs.status = 'wanted' then 'give' end as direction
    from public.user_stickers mine
    join public.user_stickers theirs on theirs.sticker_id = mine.sticker_id and theirs.user_id <> mine.user_id
    join public.stickers sticker on sticker.id = mine.sticker_id
    where mine.user_id = (select auth.uid()) and sticker.collection_id = p_collection_id
      and not exists (
        select 1 from public.user_blocks block
        where (block.blocker_id = mine.user_id and block.blocked_id = theirs.user_id)
           or (block.blocker_id = theirs.user_id and block.blocked_id = mine.user_id)
      )
      and ((mine.status = 'wanted' and theirs.status = 'duplicate') or (mine.status = 'duplicate' and theirs.status = 'wanted'))
  )
  select items.matched_user_id, profile.username, profile.display_name, profile.city,
    array_agg(distinct items.sticker_id) filter (where items.direction = 'receive'),
    array_agg(distinct items.sticker_id) filter (where items.direction = 'give'),
    count(distinct items.sticker_id) filter (where items.direction = 'receive'),
    count(distinct items.sticker_id) filter (where items.direction = 'give'),
    count(distinct items.sticker_id)
  from compatible_items items join public.profiles profile on profile.id = items.matched_user_id
  group by items.matched_user_id, profile.username, profile.display_name, profile.city
  having count(distinct items.sticker_id) filter (where items.direction = 'receive') > 0
     and count(distinct items.sticker_id) filter (where items.direction = 'give') > 0
  order by compatibility_score desc, receive_count desc, give_count desc;
$$;

revoke all on function public.get_user_matches(uuid) from public, anon;
grant execute on function public.get_user_matches(uuid) to authenticated;
