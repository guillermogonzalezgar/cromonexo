-- Comprobación de posesión mediante fotos y código temporal.
create type public.listing_verification_status as enum ('pending', 'submitted', 'used', 'expired');

create table public.listing_verifications (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  sticker_id uuid not null references public.stickers(id) on delete cascade,
  code text not null unique check (code ~ '^CN-[A-F0-9]{6}$'),
  status public.listing_verification_status not null default 'pending',
  front_path text,
  back_path text,
  proof_path text,
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  submitted_at timestamptz,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);

alter table public.market_listings
  add column verification_id uuid unique references public.listing_verifications(id);

create index listing_verifications_owner_idx on public.listing_verifications (seller_id, created_at desc);
alter table public.listing_verifications enable row level security;
create policy "users view own listing verifications" on public.listing_verifications
  for select to authenticated using (seller_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sticker-verifications', 'sticker-verifications', false, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false, file_size_limit=8388608, allowed_mime_types=array['image/jpeg','image/png','image/webp'];

create policy "users upload own verification photos" on storage.objects
  for insert to authenticated
  with check (bucket_id='sticker-verifications' and (storage.foldername(name))[1]=(select auth.uid())::text);

create policy "users view own verification photos" on storage.objects
  for select to authenticated
  using (bucket_id='sticker-verifications' and (storage.foldername(name))[1]=(select auth.uid())::text);

create policy "users delete own unused verification photos" on storage.objects
  for delete to authenticated
  using (bucket_id='sticker-verifications' and (storage.foldername(name))[1]=(select auth.uid())::text);

create or replace function public.start_listing_verification(p_sticker_id uuid)
returns table (verification_id uuid, verification_code text, expires_at timestamptz)
language plpgsql security definer set search_path=''
as $$
declare new_id uuid; new_code text; new_expiry timestamptz;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not exists(select 1 from public.stickers s join public.collections c on c.id=s.collection_id where s.id=p_sticker_id and c.is_active) then
    raise exception 'invalid sticker';
  end if;
  update public.listing_verifications set status='expired'
  where seller_id=auth.uid() and status='pending' and expires_at<=now();
  loop
    new_code := 'CN-' || upper(substr(encode(gen_random_bytes(4),'hex'),1,6));
    exit when not exists(select 1 from public.listing_verifications where code=new_code);
  end loop;
  insert into public.listing_verifications(seller_id,sticker_id,code)
  values(auth.uid(),p_sticker_id,new_code)
  returning listing_verifications.id, listing_verifications.expires_at into new_id,new_expiry;
  return query select new_id,new_code,new_expiry;
end $$;

create or replace function public.submit_listing_verification(
  p_verification_id uuid, p_front_path text, p_back_path text, p_proof_path text
) returns void
language plpgsql security definer set search_path=''
as $$
declare prefix text := auth.uid()::text || '/' || p_verification_id::text || '/';
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if p_front_path not like prefix || '%' or p_back_path not like prefix || '%' or p_proof_path not like prefix || '%' then
    raise exception 'invalid photo path';
  end if;
  if (select count(*) from storage.objects where bucket_id='sticker-verifications' and name in (p_front_path,p_back_path,p_proof_path)) <> 3 then
    raise exception 'photos missing';
  end if;
  update public.listing_verifications
  set front_path=p_front_path,back_path=p_back_path,proof_path=p_proof_path,status='submitted',submitted_at=now()
  where id=p_verification_id and seller_id=auth.uid() and status='pending' and expires_at>now();
  if not found then raise exception 'verification unavailable or expired'; end if;
end $$;

create or replace function public.create_verified_market_listing(
  p_sticker_id uuid, p_price_cents integer, p_verification_id uuid
) returns uuid
language plpgsql security definer set search_path=''
as $$
declare listing_id uuid; verified_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if p_price_cents not between 1 and 100000 then raise exception 'invalid price'; end if;
  update public.listing_verifications
  set status='used',used_at=now()
  where id=p_verification_id and seller_id=auth.uid() and sticker_id=p_sticker_id
    and status='submitted' and expires_at>now()
  returning id into verified_id;
  if not found then raise exception 'valid photo verification required'; end if;
  insert into public.market_listings(seller_id,sticker_id,price_cents,verification_id)
  values(auth.uid(),p_sticker_id,p_price_cents,verified_id)
  returning id into listing_id;
  return listing_id;
end $$;

revoke all on function public.create_market_listing(uuid,integer) from authenticated;
revoke all on function public.start_listing_verification(uuid) from public,anon;
revoke all on function public.submit_listing_verification(uuid,text,text,text) from public,anon;
revoke all on function public.create_verified_market_listing(uuid,integer,uuid) from public,anon;
grant execute on function public.start_listing_verification(uuid) to authenticated;
grant execute on function public.submit_listing_verification(uuid,text,text,text) to authenticated;
grant execute on function public.create_verified_market_listing(uuid,integer,uuid) to authenticated;
