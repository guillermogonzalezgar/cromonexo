-- Genera códigos sin depender del esquema extensions de pgcrypto.
create or replace function public.start_listing_verification(p_sticker_id uuid)
returns table (verification_id uuid, verification_code text, expires_at timestamptz)
language plpgsql security definer set search_path=''
as $$
declare new_id uuid; new_code text; new_expiry timestamptz;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not exists(
    select 1
    from public.stickers sticker
    join public.collections collection on collection.id=sticker.collection_id
    where sticker.id=p_sticker_id and collection.is_active
  ) then
    raise exception 'invalid sticker';
  end if;

  update public.listing_verifications
  set status='expired'
  where seller_id=auth.uid() and status='pending' and expires_at<=now();

  loop
    new_code := 'CN-' || upper(substr(replace(pg_catalog.gen_random_uuid()::text,'-',''),1,6));
    exit when not exists(select 1 from public.listing_verifications where code=new_code);
  end loop;

  insert into public.listing_verifications(seller_id,sticker_id,code)
  values(auth.uid(),p_sticker_id,new_code)
  returning listing_verifications.id,listing_verifications.expires_at into new_id,new_expiry;

  return query select new_id,new_code,new_expiry;
end $$;

revoke all on function public.start_listing_verification(uuid) from public,anon;
grant execute on function public.start_listing_verification(uuid) to authenticated;
