-- Mantiene separadas las cuentas conectadas de prueba y producción.
alter table public.payment_accounts add column livemode boolean not null default false;
alter table public.payment_accounts drop constraint payment_accounts_pkey;
alter table public.payment_accounts add primary key (user_id,livemode);

drop function public.save_payment_account(text);
create function public.save_payment_account(p_stripe_account_id text,p_livemode boolean)
returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or p_stripe_account_id !~ '^acct_' then raise exception 'invalid account'; end if;
  insert into public.payment_accounts(user_id,stripe_account_id,livemode)
  values(auth.uid(),p_stripe_account_id,p_livemode)
  on conflict(user_id,livemode) do update set stripe_account_id=excluded.stripe_account_id,updated_at=now();
end $$;

drop function public.update_payment_account_status(boolean,boolean,boolean);
create function public.update_payment_account_status(p_charges boolean,p_payouts boolean,p_complete boolean,p_livemode boolean)
returns void language plpgsql security definer set search_path='' as $$
begin
  update public.payment_accounts set charges_enabled=p_charges,payouts_enabled=p_payouts,onboarding_complete=p_complete,updated_at=now()
  where user_id=auth.uid() and livemode=p_livemode;
  if not found then raise exception 'payment account missing'; end if;
end $$;

revoke all on function public.save_payment_account(text,boolean) from public,anon;
revoke all on function public.update_payment_account_status(boolean,boolean,boolean,boolean) from public,anon;
grant execute on function public.save_payment_account(text,boolean) to authenticated;
grant execute on function public.update_payment_account_status(boolean,boolean,boolean,boolean) to authenticated;
