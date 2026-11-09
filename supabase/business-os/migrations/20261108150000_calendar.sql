-- Calendar events: things planned on the admin calendar itself (ad campaigns,
-- bills, deadlines, meetings). Other dated rows (expenses, registrations, notes,
-- bank) are read from their own tables by the loader and are not copied here.
--
-- Dates are civil days in Europe/London; ends_on is inclusive. No times means an
-- all-day event. A recurrence repeats the whole span every `interval` weeks,
-- months or years until `until` (inclusive) or forever.
--
-- These rows deliberately stay out of business_os.timeline_items: that view feeds
-- Telegram reminders, which must never carry money, and events here can.
-- Every write goes through a function, executable by service_role only.

create table business_os.calendar_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  project_id uuid references business_os.projects (id),
  title text not null check (title = btrim(title) and char_length(title) between 1 and 200),
  notes text check (char_length(notes) <= 5000),
  category text not null check (category in ('advertising', 'bill', 'deadline', 'meeting')),
  starts_on date not null,
  ends_on date not null,
  start_time time,
  end_time time,
  amount numeric check (amount > 0),
  currency text check (currency ~ '^[A-Z]{3}$'),
  recurrence jsonb check (recurrence is null or jsonb_typeof(recurrence) = 'object'),
  status text not null default 'planned' check (status in ('planned', 'done', 'cancelled')),
  link_kind text check (link_kind in ('note', 'document', 'expense', 'registration')),
  link_id uuid,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on and ends_on - starts_on <= 366),
  check (end_time is null or start_time is not null),
  check (end_time is null or ends_on > starts_on or end_time >= start_time),
  check ((amount is null) = (currency is null)),
  check ((link_kind is null) = (link_id is null))
);

create index calendar_events_org_starts_idx on business_os.calendar_events (organization_id, starts_on);
create index calendar_events_org_ends_idx on business_os.calendar_events (organization_id, ends_on);

alter table business_os.calendar_events enable row level security;
alter table business_os.calendar_events force row level security;

create policy calendar_events_select on business_os.calendar_events
for select to authenticated using (business_os.is_active_member(organization_id));

revoke all on business_os.calendar_events from public, anon, authenticated;
grant select on business_os.calendar_events to authenticated;

/* ---------- Writes (owner/admin) ---------- */

-- Checks one create/update payload and returns the row to store (id, timestamps
-- and created_by are left for the caller). Raises a calendar_* code on bad input.
create function business_os.calendar_event_from_payload(org_id uuid, payload jsonb)
returns business_os.calendar_events
language plpgsql
stable
set search_path = ''
as $fn$
declare
  r business_os.calendar_events;
  raw_start text := nullif(payload ->> 'start_time', '');
  raw_end text := nullif(payload ->> 'end_time', '');
  raw_amount text := nullif(payload ->> 'amount', '');
  raw_currency text := nullif(payload ->> 'currency', '');
  rule jsonb := payload -> 'recurrence';
  rule_until date;
  link_found boolean;
begin
  r.organization_id := org_id;

  r.title := btrim(coalesce(payload ->> 'title', ''));
  if jsonb_typeof(payload -> 'title') is distinct from 'string' or char_length(r.title) not between 1 and 200 then
    raise exception 'calendar_title_invalid' using errcode = '22023';
  end if;

  r.notes := nullif(payload ->> 'notes', '');
  if char_length(r.notes) > 5000 then
    raise exception 'calendar_notes_invalid' using errcode = '22023';
  end if;

  r.category := payload ->> 'category';
  if r.category is null or r.category not in ('advertising', 'bill', 'deadline', 'meeting') then
    raise exception 'calendar_category_invalid' using errcode = '22023';
  end if;

  begin
    r.starts_on := business_os.parse_date(nullif(payload ->> 'starts_on', ''));
    r.ends_on := business_os.parse_date(nullif(payload ->> 'ends_on', ''));
  exception when others then
    raise exception 'calendar_dates_invalid' using errcode = '22023';
  end;
  if r.starts_on is null or r.ends_on is null or r.ends_on < r.starts_on or r.ends_on - r.starts_on > 366 then
    raise exception 'calendar_dates_invalid' using errcode = '22023';
  end if;

  if (raw_start is not null and raw_start !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
    or (raw_end is not null and raw_end !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
    or (raw_end is not null and raw_start is null) then
    raise exception 'calendar_time_invalid' using errcode = '22023';
  end if;
  r.start_time := raw_start::time;
  r.end_time := raw_end::time;
  if r.end_time is not null and r.ends_on = r.starts_on and r.end_time < r.start_time then
    raise exception 'calendar_time_invalid' using errcode = '22023';
  end if;

  if jsonb_typeof(payload -> 'amount') = 'number' or (raw_amount is null) <> (raw_currency is null) then
    raise exception 'calendar_money_invalid' using errcode = '22023';
  end if;
  if raw_amount is not null then
    begin
      r.amount := business_os.parse_amount(raw_amount, raw_currency, null, null);
    exception when others then
      raise exception 'calendar_money_invalid' using errcode = '22023';
    end;
    if r.amount <= 0 then
      raise exception 'calendar_money_invalid' using errcode = '22023';
    end if;
    r.currency := raw_currency;
  end if;

  if rule is not null and jsonb_typeof(rule) <> 'null' then
    if jsonb_typeof(rule) <> 'object'
      or rule ->> 'freq' is null
      or rule ->> 'freq' not in ('weekly', 'monthly', 'yearly')
      or jsonb_typeof(rule -> 'interval') is distinct from 'number'
      or (rule ->> 'interval') !~ '^([1-9]|[1-4][0-9]|5[0-2])$'
      or jsonb_typeof(coalesce(rule -> 'until', 'null'::jsonb)) not in ('null', 'string') then
      raise exception 'calendar_recurrence_invalid' using errcode = '22023';
    end if;
    begin
      rule_until := business_os.parse_date(rule ->> 'until');
    exception when others then
      raise exception 'calendar_recurrence_invalid' using errcode = '22023';
    end;
    if rule_until is not null and rule_until < r.starts_on then
      raise exception 'calendar_recurrence_invalid' using errcode = '22023';
    end if;
    r.recurrence := jsonb_build_object(
      'freq', rule ->> 'freq',
      'interval', (rule ->> 'interval')::integer,
      'until', to_jsonb(rule_until::text)
    );
  end if;

  r.status := coalesce(nullif(payload ->> 'status', ''), 'planned');
  if r.status not in ('planned', 'done', 'cancelled') then
    raise exception 'calendar_status_invalid' using errcode = '22023';
  end if;

  if nullif(payload ->> 'project_slug', '') is not null then
    -- Resolved inline: business_os.project_in_org compares p.slug with itself (the column
    -- shadows its `slug` parameter), so it returns some project for any slug.
    select p.id into r.project_id
    from business_os.projects p
    where p.organization_id = org_id and p.slug = payload ->> 'project_slug';
    if r.project_id is null then
      raise exception 'project_missing' using errcode = '22023';
    end if;
  end if;

  r.link_kind := nullif(payload ->> 'link_kind', '');
  if (r.link_kind is null) <> (nullif(payload ->> 'link_id', '') is null) then
    raise exception 'calendar_link_invalid' using errcode = '22023';
  end if;
  if r.link_kind is not null then
    if r.link_kind not in ('note', 'document', 'expense', 'registration')
      or payload ->> 'link_id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'calendar_link_invalid' using errcode = '22023';
    end if;
    r.link_id := (payload ->> 'link_id')::uuid;
    link_found := case r.link_kind
      when 'note' then exists (select 1 from business_os.notes x where x.id = r.link_id and x.organization_id = org_id)
      when 'document' then exists (select 1 from business_os.documents x where x.id = r.link_id and x.organization_id = org_id)
      when 'expense' then exists (select 1 from business_os.expenses x where x.id = r.link_id and x.organization_id = org_id)
      else exists (select 1 from business_os.service_registrations x where x.id = r.link_id and x.organization_id = org_id)
    end;
    if not link_found then
      raise exception 'calendar_link_invalid' using errcode = '22023';
    end if;
  end if;

  return r;
end;
$fn$;

-- The event id from an update/delete payload, or calendar_event_not_found when it is not a uuid.
create function business_os.calendar_event_id(payload jsonb)
returns uuid
language plpgsql
immutable
set search_path = ''
as $fn$
begin
  if payload ->> 'id' is null or payload ->> 'id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'calendar_event_not_found' using errcode = '22023';
  end if;
  return (payload ->> 'id')::uuid;
end;
$fn$;

create function business_os.create_calendar_event(actor_id uuid, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
  r business_os.calendar_events;
  event_id uuid;
begin
  org_id := business_os.assert_operations_writer(actor_id);
  r := business_os.calendar_event_from_payload(org_id, payload);
  insert into business_os.calendar_events (
    organization_id, project_id, title, notes, category, starts_on, ends_on, start_time, end_time,
    amount, currency, recurrence, status, link_kind, link_id, created_by
  ) values (
    org_id, r.project_id, r.title, r.notes, r.category, r.starts_on, r.ends_on, r.start_time, r.end_time,
    r.amount, r.currency, r.recurrence, r.status, r.link_kind, r.link_id, actor_id
  )
  returning id into event_id;
  return jsonb_build_object('id', event_id);
end;
$fn$;

create function business_os.update_calendar_event(actor_id uuid, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
  r business_os.calendar_events;
  event_id uuid;
begin
  org_id := business_os.assert_operations_writer(actor_id);
  event_id := business_os.calendar_event_id(payload);
  if not exists (select 1 from business_os.calendar_events e where e.id = event_id and e.organization_id = org_id) then
    raise exception 'calendar_event_not_found' using errcode = '22023';
  end if;
  r := business_os.calendar_event_from_payload(org_id, payload);
  update business_os.calendar_events e
  set project_id = r.project_id,
      title = r.title,
      notes = r.notes,
      category = r.category,
      starts_on = r.starts_on,
      ends_on = r.ends_on,
      start_time = r.start_time,
      end_time = r.end_time,
      amount = r.amount,
      currency = r.currency,
      recurrence = r.recurrence,
      status = r.status,
      link_kind = r.link_kind,
      link_id = r.link_id,
      updated_at = now()
  where e.id = event_id and e.organization_id = org_id;
  return jsonb_build_object('id', event_id);
end;
$fn$;

create function business_os.delete_calendar_event(actor_id uuid, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
  event_id uuid;
begin
  org_id := business_os.assert_operations_writer(actor_id);
  event_id := business_os.calendar_event_id(payload);
  delete from business_os.calendar_events e where e.id = event_id and e.organization_id = org_id;
  if not found then
    raise exception 'calendar_event_not_found' using errcode = '22023';
  end if;
  return jsonb_build_object('id', event_id);
end;
$fn$;

revoke all on function business_os.calendar_event_from_payload(uuid, jsonb) from public, anon, authenticated;
revoke all on function business_os.calendar_event_id(jsonb) from public, anon, authenticated;
revoke all on function business_os.create_calendar_event(uuid, jsonb) from public, anon, authenticated;
revoke all on function business_os.update_calendar_event(uuid, jsonb) from public, anon, authenticated;
revoke all on function business_os.delete_calendar_event(uuid, jsonb) from public, anon, authenticated;
grant execute on function business_os.create_calendar_event(uuid, jsonb) to service_role;
grant execute on function business_os.update_calendar_event(uuid, jsonb) to service_role;
grant execute on function business_os.delete_calendar_event(uuid, jsonb) to service_role;
