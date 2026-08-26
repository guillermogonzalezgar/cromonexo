-- Los usuarios autenticados pueden ver temporalmente las fotos de anuncios activos.
create policy "authenticated view active listing verification" on public.listing_verifications
for select to authenticated using (
  status='used' and exists (
    select 1 from public.market_listings listing
    where listing.verification_id=listing_verifications.id and listing.status='active'
  )
);

create policy "authenticated view active listing photos" on storage.objects
for select to authenticated using (
  bucket_id='sticker-verifications' and exists (
    select 1 from public.listing_verifications verification
    join public.market_listings listing on listing.verification_id=verification.id
    where listing.status='active' and name in (verification.front_path,verification.back_path,verification.proof_path)
  )
);
