-- Tap-to-approve confirmation. A sensitive write in the browser opens a request;
-- the member approves it from their linked Telegram account; the browser that
-- asked then claims it once and receives the trusted-device cookie.

create table business_os.step_up_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  user_id uuid not null references auth.users (id),
  device_hash text not null check (device_hash ~ '^[a-f0-9]{64}$'),
  label text not null check (char_length(label) between 1 and 120),
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied', 'claimed')),
  telegram_user_id bigint,
  expires_at timestamptz not null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index step_up_requests_user_idx on business_os.step_up_requests (user_id);

alter table business_os.step_up_requests enable row level security;
alter table business_os.step_up_requests force row level security;

create policy step_up_requests_select on business_os.step_up_requests
for select to authenticated
using (user_id = (select auth.uid()) and business_os.is_active_member(organization_id));

revoke all on business_os.step_up_requests from public, anon, authenticated;
grant select on business_os.step_up_requests to authenticated;

create function business_os.create_step_up_request(actor_id uuid, device_hash text, label text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
  request_id uuid;
begin
  select m.organization_id into org_id
  from business_os.memberships m
  where m.user_id = actor_id
    and m.revoked_at is null
  limit 1;
  if org_id is null then
    raise exception 'membership_missing' using errcode = '42501';
  end if;

  -- One live request per member: a new ask replaces anything still open or finished.
  delete from business_os.step_up_requests r where r.user_id = actor_id;

  insert into business_os.step_up_requests (organization_id, user_id, device_hash, label, expires_at)
  values (org_id, actor_id, device_hash, left(btrim(label), 120), clock_timestamp() + interval '5 minutes')
  returning id into request_id;
  return request_id;
end;
$fn$;

create function business_os.decide_step_up_request(
  actor_id uuid,
  request_id uuid,
  bot_id text,
  telegram_user_id bigint,
  approve boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  request business_os.step_up_requests%rowtype;
  outcome text;
begin
  select * into request
  from business_os.step_up_requests r
  where r.id = request_id
    and r.user_id = actor_id
  for update;
  if request.id is null or request.status <> 'pending' or request.expires_at <= clock_timestamp() then
    raise exception 'step_up_request_invalid' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from business_os.telegram_identities ti
    join business_os.memberships m on m.user_id = ti.user_id and m.revoked_at is null
    where ti.user_id = actor_id
      and ti.bot_id = decide_step_up_request.bot_id
      and ti.telegram_user_id = decide_step_up_request.telegram_user_id
      and ti.revoked_at is null
  ) then
    raise exception 'step_up_request_invalid' using errcode = '22023';
  end if;

  outcome := case when approve then 'approved' else 'denied' end;
  update business_os.step_up_requests r
  set status = outcome, telegram_user_id = decide_step_up_request.telegram_user_id, decided_at = clock_timestamp()
  where r.id = request.id;

  insert into business_os.identity_events (organization_id, actor_user_id, action, subject, reason)
  values (request.organization_id, actor_id, 'step_up_' || outcome, decide_step_up_request.telegram_user_id::text, request.label);

  return outcome;
end;
$fn$;

-- Returns pending, approved, denied or expired. `approved` is returned once, to the device that asked.
create function business_os.claim_step_up_request(actor_id uuid, request_id uuid, device_hash text)
returns text
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  request business_os.step_up_requests%rowtype;
begin
  select * into request
  from business_os.step_up_requests r
  where r.id = request_id
    and r.user_id = actor_id
    and r.device_hash = claim_step_up_request.device_hash
  for update;
  if request.id is null or request.status = 'claimed' then
    return 'expired';
  end if;
  if request.status = 'denied' then
    return 'denied';
  end if;
  if request.expires_at <= clock_timestamp() then
    return 'expired';
  end if;
  if request.status = 'pending' then
    return 'pending';
  end if;

  if not exists (
    select 1 from business_os.memberships m where m.user_id = actor_id and m.revoked_at is null
  ) then
    return 'expired';
  end if;

  update business_os.step_up_requests r set status = 'claimed' where r.id = request.id;
  return 'approved';
end;
$fn$;

revoke all on function business_os.create_step_up_request(uuid, text, text) from public, anon, authenticated;
revoke all on function business_os.decide_step_up_request(uuid, uuid, text, bigint, boolean) from public, anon, authenticated;
revoke all on function business_os.claim_step_up_request(uuid, uuid, text) from public, anon, authenticated;
grant execute on function business_os.create_step_up_request(uuid, text, text) to service_role;
grant execute on function business_os.decide_step_up_request(uuid, uuid, text, bigint, boolean) to service_role;
grant execute on function business_os.claim_step_up_request(uuid, uuid, text) to service_role;
