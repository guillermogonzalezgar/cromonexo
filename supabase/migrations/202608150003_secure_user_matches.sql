-- Matching seguro: solo devuelve compatibilidades del usuario autenticado.
create or replace function public.get_user_matches(p_collection_id uuid)
returns table (
  matched_user_id uuid,
  username text,
  display_name text,
  city text,
  can_receive uuid[],
  can_give uuid[],
  receive_count bigint,
  give_count bigint,
  compatibility_score bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with compatible_items as (
    select
      theirs.user_id as matched_user_id,
      mine.sticker_id,
      case
        when mine.status = 'wanted' and theirs.status = 'duplicate' then 'receive'
        when mine.status = 'duplicate' and theirs.status = 'wanted' then 'give'
      end as direction
    from public.user_stickers mine
    join public.user_stickers theirs
      on theirs.sticker_id = mine.sticker_id
     and theirs.user_id <> mine.user_id
    join public.stickers sticker on sticker.id = mine.sticker_id
    where mine.user_id = (select auth.uid())
      and sticker.collection_id = p_collection_id
      and (
        (mine.status = 'wanted' and theirs.status = 'duplicate')
        or (mine.status = 'duplicate' and theirs.status = 'wanted')
      )
  )
  select
    items.matched_user_id,
    profile.username,
    profile.display_name,
    profile.city,
    array_agg(distinct items.sticker_id) filter (where items.direction = 'receive') as can_receive,
    array_agg(distinct items.sticker_id) filter (where items.direction = 'give') as can_give,
    count(distinct items.sticker_id) filter (where items.direction = 'receive') as receive_count,
    count(distinct items.sticker_id) filter (where items.direction = 'give') as give_count,
    count(distinct items.sticker_id) as compatibility_score
  from compatible_items items
  join public.profiles profile on profile.id = items.matched_user_id
  group by items.matched_user_id, profile.username, profile.display_name, profile.city
  having count(distinct items.sticker_id) filter (where items.direction = 'receive') > 0
     and count(distinct items.sticker_id) filter (where items.direction = 'give') > 0
  order by compatibility_score desc, receive_count desc, give_count desc;
$$;

revoke all on function public.get_user_matches(uuid) from public;
revoke all on function public.get_user_matches(uuid) from anon;
grant execute on function public.get_user_matches(uuid) to authenticated;
