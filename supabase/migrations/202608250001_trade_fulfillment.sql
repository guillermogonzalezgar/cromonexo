create type public.trade_fulfillment_status as enum ('accepted', 'preparing', 'shipped', 'received', 'completed');

alter table public.trade_proposals
  add column fulfillment_status public.trade_fulfillment_status,
  add column proposer_prepared_at timestamptz,
  add column recipient_prepared_at timestamptz,
  add column proposer_shipped_at timestamptz,
  add column recipient_shipped_at timestamptz,
  add column proposer_received_at timestamptz,
  add column recipient_received_at timestamptz,
  add column proposer_tracking_code text check (proposer_tracking_code is null or length(proposer_tracking_code) between 2 and 100),
  add column recipient_tracking_code text check (recipient_tracking_code is null or length(recipient_tracking_code) between 2 and 100);

update public.trade_proposals set fulfillment_status = 'accepted' where status = 'accepted';
create index trade_fulfillment_idx on public.trade_proposals (fulfillment_status, updated_at desc) where status = 'accepted';

create or replace function public.respond_trade_proposal(p_proposal_id uuid, p_response text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if p_response not in ('accepted','rejected') then raise exception 'invalid response'; end if;
  update public.trade_proposals
  set status=p_response::public.trade_status,
      fulfillment_status=case when p_response='accepted' then 'accepted'::public.trade_fulfillment_status else null end,
      responded_at=now(),updated_at=now()
  where id=p_proposal_id and recipient_id=auth.uid() and status='pending';
  if not found then raise exception 'proposal unavailable'; end if;
end $$;

revoke all on function public.respond_trade_proposal(uuid,text) from public,anon;
grant execute on function public.respond_trade_proposal(uuid,text) to authenticated;

create or replace function public.update_trade_fulfillment(p_proposal_id uuid, p_action text, p_tracking_code text default null)
returns public.trade_fulfillment_status language plpgsql security definer set search_path = '' as $$
declare proposal public.trade_proposals%rowtype; current_user_id uuid := auth.uid(); next_status public.trade_fulfillment_status;
begin
  if current_user_id is null then raise exception 'authentication required'; end if;
  if p_action not in ('prepare', 'ship', 'receive') then raise exception 'invalid action'; end if;
  select * into proposal from public.trade_proposals where id = p_proposal_id for update;
  if not found or current_user_id not in (proposal.proposer_id, proposal.recipient_id) then raise exception 'proposal unavailable'; end if;
  if proposal.status <> 'accepted' then raise exception 'proposal not accepted'; end if;

  if p_action = 'prepare' then
    if current_user_id = proposal.proposer_id then
      update public.trade_proposals set proposer_prepared_at=coalesce(proposer_prepared_at,now()),updated_at=now() where id=p_proposal_id;
    else
      update public.trade_proposals set recipient_prepared_at=coalesce(recipient_prepared_at,now()),updated_at=now() where id=p_proposal_id;
    end if;
  elsif p_action = 'ship' then
    if current_user_id = proposal.proposer_id then
      if proposal.proposer_shipped_at is not null then raise exception 'already shipped'; end if;
      update public.trade_proposals set proposer_prepared_at=coalesce(proposer_prepared_at,now()),proposer_shipped_at=now(),proposer_tracking_code=nullif(left(trim(p_tracking_code),100),''),updated_at=now() where id=p_proposal_id;
    else
      if proposal.recipient_shipped_at is not null then raise exception 'already shipped'; end if;
      update public.trade_proposals set recipient_prepared_at=coalesce(recipient_prepared_at,now()),recipient_shipped_at=now(),recipient_tracking_code=nullif(left(trim(p_tracking_code),100),''),updated_at=now() where id=p_proposal_id;
    end if;
  else
    if current_user_id = proposal.proposer_id then
      if proposal.recipient_shipped_at is null then raise exception 'other parcel not shipped'; end if;
      update public.trade_proposals set proposer_received_at=coalesce(proposer_received_at,now()),updated_at=now() where id=p_proposal_id;
    else
      if proposal.proposer_shipped_at is null then raise exception 'other parcel not shipped'; end if;
      update public.trade_proposals set recipient_received_at=coalesce(recipient_received_at,now()),updated_at=now() where id=p_proposal_id;
    end if;
  end if;

  select * into proposal from public.trade_proposals where id=p_proposal_id;
  next_status := case
    when proposal.proposer_received_at is not null and proposal.recipient_received_at is not null then 'completed'
    when proposal.proposer_received_at is not null or proposal.recipient_received_at is not null then 'received'
    when proposal.proposer_shipped_at is not null and proposal.recipient_shipped_at is not null then 'shipped'
    when proposal.proposer_prepared_at is not null or proposal.recipient_prepared_at is not null or proposal.proposer_shipped_at is not null or proposal.recipient_shipped_at is not null then 'preparing'
    else 'accepted' end;
  update public.trade_proposals set fulfillment_status=next_status,updated_at=now() where id=p_proposal_id;
  return next_status;
end $$;

revoke all on function public.update_trade_fulfillment(uuid,text,text) from public,anon;
grant execute on function public.update_trade_fulfillment(uuid,text,text) to authenticated;
