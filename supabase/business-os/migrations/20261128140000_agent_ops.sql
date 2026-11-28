-- What an agent (and the owner) needs to run the company day to day:
-- tasks, a "release" calendar category, an editable company profile, a log of
-- agent actions, and read functions so machine access never needs table grants.

/* ---------- Tasks ---------- */

create table business_os.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  project_id uuid references business_os.projects (id),
  title text not null check (title = btrim(title) and char_length(title) between 1 and 200),
  notes text check (char_length(notes) <= 5000),
  due_on date,
  status text not null default 'open' check (status in ('open', 'doing', 'done', 'cancelled')),
  assignee text not null default 'owner' check (assignee in ('owner', 'agent')),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index tasks_org_status_idx on business_os.tasks (organization_id, status, due_on);

alter table business_os.tasks enable row level security;
alter table business_os.tasks force row level security;

create policy tasks_select on business_os.tasks
for select to authenticated using (business_os.is_active_member(organization_id));

revoke all on business_os.tasks from public, anon, authenticated;
grant select on business_os.tasks to authenticated;

create function business_os.task_json(t business_os.tasks)
returns jsonb
language sql
stable
set search_path = ''
as $fn$
  select jsonb_build_object(
    'id', t.id,
    'title', t.title,
    'notes', t.notes,
    'dueOn', t.due_on,
    'status', t.status,
    'assignee', t.assignee,
    'projectSlug', (select p.slug from business_os.projects p where p.id = t.project_id),
    'createdAt', t.created_at,
    'completedAt', t.completed_at
  );
$fn$;

-- Creates a task, or updates the one named by payload.id. Only the keys sent are changed on update.
create function business_os.save_task(actor_id uuid, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
  t business_os.tasks;
  next_title text;
  next_status text;
  next_assignee text;
  next_project uuid;
begin
  org_id := business_os.assert_operations_writer(actor_id);

  if nullif(payload ->> 'id', '') is not null then
    select * into t from business_os.tasks x
    where x.id = (payload ->> 'id')::uuid and x.organization_id = org_id
    for update;
    if t.id is null then
      raise exception 'task_missing' using errcode = '22023';
    end if;
  else
    t.organization_id := org_id;
    t.status := 'open';
    t.assignee := 'owner';
    t.created_by := actor_id;
  end if;

  if payload ? 'title' or t.id is null then
    next_title := btrim(coalesce(payload ->> 'title', ''));
    if char_length(next_title) not between 1 and 200 then
      raise exception 'task_title_invalid' using errcode = '22023';
    end if;
    t.title := next_title;
  end if;
  if payload ? 'notes' then
    t.notes := nullif(payload ->> 'notes', '');
    if char_length(t.notes) > 5000 then
      raise exception 'task_notes_invalid' using errcode = '22023';
    end if;
    perform business_os.reject_secret_notes(t.notes);
  end if;
  if payload ? 'due_on' then
    begin
      t.due_on := business_os.parse_date(nullif(payload ->> 'due_on', ''));
    exception when others then
      raise exception 'task_date_invalid' using errcode = '22023';
    end;
  end if;
  if payload ? 'status' then
    next_status := payload ->> 'status';
    if next_status is null or next_status not in ('open', 'doing', 'done', 'cancelled') then
      raise exception 'task_status_invalid' using errcode = '22023';
    end if;
    if next_status = 'done' and t.status is distinct from 'done' then
      t.completed_at := clock_timestamp();
    elsif next_status <> 'done' then
      t.completed_at := null;
    end if;
    t.status := next_status;
  end if;
  if payload ? 'assignee' then
    next_assignee := payload ->> 'assignee';
    if next_assignee is null or next_assignee not in ('owner', 'agent') then
      raise exception 'task_assignee_invalid' using errcode = '22023';
    end if;
    t.assignee := next_assignee;
  end if;
  if payload ? 'project_slug' then
    if nullif(payload ->> 'project_slug', '') is null then
      t.project_id := null;
    else
      select p.id into next_project from business_os.projects p
      where p.organization_id = org_id and p.slug = payload ->> 'project_slug';
      if next_project is null then
        raise exception 'task_project_invalid' using errcode = '22023';
      end if;
      t.project_id := next_project;
    end if;
  end if;

  if t.id is null then
    insert into business_os.tasks (organization_id, project_id, title, notes, due_on, status, assignee, created_by, completed_at)
    values (t.organization_id, t.project_id, t.title, t.notes, t.due_on, t.status, t.assignee, t.created_by, t.completed_at)
    returning * into t;
  else
    update business_os.tasks x
    set project_id = t.project_id, title = t.title, notes = t.notes, due_on = t.due_on, status = t.status,
        assignee = t.assignee, completed_at = t.completed_at, updated_at = clock_timestamp()
    where x.id = t.id
    returning * into t;
  end if;
  return business_os.task_json(t);
end;
$fn$;

create function business_os.delete_task(actor_id uuid, task_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
begin
  org_id := business_os.assert_operations_writer(actor_id);
  delete from business_os.tasks x where x.id = task_id and x.organization_id = org_id;
  if not found then
    raise exception 'task_missing' using errcode = '22023';
  end if;
  return jsonb_build_object('id', task_id);
end;
$fn$;

-- Open and in-progress tasks first by due date; closed ones only when asked, newest first.
create function business_os.list_tasks(actor_id uuid, include_closed boolean default false)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
begin
  org_id := business_os.assert_operations_reader(actor_id);
  return coalesce((
    select jsonb_agg(business_os.task_json(x) order by (x.status in ('done', 'cancelled')), x.due_on nulls last, x.created_at desc)
    from (
      select * from business_os.tasks t
      where t.organization_id = org_id
        and (include_closed or t.status in ('open', 'doing'))
      order by t.created_at desc
      limit 500
    ) x
  ), '[]'::jsonb);
end;
$fn$;

/* ---------- Calendar: a "release" category beside advertising, bill, deadline, meeting ---------- */

alter table business_os.calendar_events drop constraint calendar_events_category_check;
alter table business_os.calendar_events
  add constraint calendar_events_category_check check (category in ('advertising', 'bill', 'deadline', 'meeting', 'release'));

-- The payload check lists the categories too. Patch that one line in place rather than restating the whole function.
do $do$
declare
  source text;
  patched text;
begin
  select pg_get_functiondef('business_os.calendar_event_from_payload(uuid, jsonb)'::regprocedure) into source;
  patched := replace(source, $s$('advertising', 'bill', 'deadline', 'meeting')$s$, $s$('advertising', 'bill', 'deadline', 'meeting', 'release')$s$);
  if patched = source then
    raise exception 'calendar_event_from_payload has no category list to extend';
  end if;
  execute patched;
end;
$do$;

create function business_os.list_calendar_events(actor_id uuid, from_date date, to_date date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
begin
  org_id := business_os.assert_operations_reader(actor_id);
  if from_date is null or to_date is null or to_date < from_date or to_date - from_date > 800 then
    raise exception 'calendar_dates_invalid' using errcode = '22023';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', e.id, 'title', e.title, 'notes', e.notes, 'category', e.category, 'status', e.status,
      'startsOn', e.starts_on, 'endsOn', e.ends_on, 'startTime', e.start_time, 'endTime', e.end_time,
      'amount', e.amount, 'currency', e.currency, 'recurrence', e.recurrence,
      'projectSlug', (select p.slug from business_os.projects p where p.id = e.project_id)
    ) order by e.starts_on, e.created_at)
    from business_os.calendar_events e
    where e.organization_id = org_id
      and (e.recurrence is not null or (e.starts_on <= to_date and e.ends_on >= from_date))
  ), '[]'::jsonb);
end;
$fn$;

/* ---------- Company profile ---------- */

alter table business_os.legal_entities
  add column incorporated_on date,
  add column year_end_month smallint check (year_end_month between 1 and 12),
  add column year_end_day smallint check (year_end_day between 1 and 31),
  add column vat_number text check (vat_number is null or char_length(vat_number) between 1 and 20),
  add column vat_stagger smallint check (vat_stagger in (1, 2, 3)),
  add column director_name text check (director_name is null or char_length(director_name) between 1 and 200);

-- Public facts from the Companies House record, where nothing was entered yet.
update business_os.legal_entities e
set jurisdiction = coalesce(e.jurisdiction, 'England and Wales'),
    registration_reference = coalesce(e.registration_reference, '16861177'),
    address = coalesce(e.address, '2 Frederick Street, Kings Cross, London, WC1X 0ND, England and Wales, United Kingdom'),
    incorporated_on = coalesce(e.incorporated_on, date '2025-11-17'),
    year_end_month = coalesce(e.year_end_month, 11),
    year_end_day = coalesce(e.year_end_day, 30)
from business_os.organizations o
where o.id = e.organization_id
  and o.slug = 'simnetiq'
  and e.legal_name = 'Simnetiq Ltd';

create function business_os.company_profile_json(e business_os.legal_entities)
returns jsonb
language sql
stable
set search_path = ''
as $fn$
  select jsonb_build_object(
    'id', e.id,
    'legalName', e.legal_name,
    'jurisdiction', e.jurisdiction,
    'companyNumber', e.registration_reference,
    'utr', e.tax_reference,
    'address', e.address,
    'incorporatedOn', e.incorporated_on,
    'yearEndMonth', e.year_end_month,
    'yearEndDay', e.year_end_day,
    'vatNumber', e.vat_number,
    'vatStagger', e.vat_stagger,
    'directorName', e.director_name,
    'notes', e.notes,
    'updatedAt', e.updated_at
  );
$fn$;

-- The organization's own legal entity (the first one created). Null when none exists.
create function business_os.company_profile(actor_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
  e business_os.legal_entities;
begin
  org_id := business_os.assert_operations_reader(actor_id);
  select * into e from business_os.legal_entities x where x.organization_id = org_id order by x.created_at, x.id limit 1;
  if e.id is null then
    return null;
  end if;
  return business_os.company_profile_json(e);
end;
$fn$;

-- Updates the organization's own legal entity. Only the keys sent are changed; an empty string clears a field.
create function business_os.save_company_profile(actor_id uuid, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
  e business_os.legal_entities;
begin
  org_id := business_os.assert_operations_writer(actor_id);
  select * into e from business_os.legal_entities x where x.organization_id = org_id order by x.created_at, x.id limit 1 for update;
  if e.id is null then
    raise exception 'company_profile_missing' using errcode = '22023';
  end if;

  begin
    if payload ? 'legal_name' then e.legal_name := btrim(payload ->> 'legal_name'); end if;
    if payload ? 'jurisdiction' then e.jurisdiction := nullif(btrim(payload ->> 'jurisdiction'), ''); end if;
    if payload ? 'company_number' then e.registration_reference := nullif(btrim(payload ->> 'company_number'), ''); end if;
    if payload ? 'utr' then e.tax_reference := nullif(btrim(payload ->> 'utr'), ''); end if;
    if payload ? 'address' then e.address := nullif(btrim(payload ->> 'address'), ''); end if;
    if payload ? 'incorporated_on' then e.incorporated_on := business_os.parse_date(nullif(payload ->> 'incorporated_on', '')); end if;
    if payload ? 'year_end_month' then e.year_end_month := nullif(payload ->> 'year_end_month', '')::smallint; end if;
    if payload ? 'year_end_day' then e.year_end_day := nullif(payload ->> 'year_end_day', '')::smallint; end if;
    if payload ? 'vat_number' then e.vat_number := nullif(upper(replace(btrim(payload ->> 'vat_number'), ' ', '')), ''); end if;
    if payload ? 'vat_stagger' then e.vat_stagger := nullif(payload ->> 'vat_stagger', '')::smallint; end if;
    if payload ? 'director_name' then e.director_name := nullif(btrim(payload ->> 'director_name'), ''); end if;
  exception when others then
    raise exception 'company_profile_invalid' using errcode = '22023';
  end;
  if e.legal_name is null or char_length(e.legal_name) not between 1 and 200
    or (e.year_end_month is null) <> (e.year_end_day is null) then
    raise exception 'company_profile_invalid' using errcode = '22023';
  end if;

  begin
    update business_os.legal_entities x
    set legal_name = e.legal_name, jurisdiction = e.jurisdiction, registration_reference = e.registration_reference,
        tax_reference = e.tax_reference, address = e.address, incorporated_on = e.incorporated_on,
        year_end_month = e.year_end_month, year_end_day = e.year_end_day, vat_number = e.vat_number,
        vat_stagger = e.vat_stagger, director_name = e.director_name, updated_at = clock_timestamp()
    where x.id = e.id
    returning * into e;
  exception when check_violation then
    raise exception 'company_profile_invalid' using errcode = '22023';
  end;
  return business_os.company_profile_json(e);
end;
$fn$;

/* ---------- Documents: read functions for machine access ---------- */

create function business_os.list_documents(actor_id uuid, folder_path text default null, with_tags text[] default null, max_rows integer default 100)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
begin
  org_id := business_os.assert_operations_reader(actor_id);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', d.id, 'title', d.title, 'folder', d.folder, 'origin', d.origin, 'category', d.category, 'vendor', d.vendor,
      'tags', d.tags, 'mimeType', d.mime_type, 'byteSize', d.byte_size, 'uploadStatus', d.upload_status,
      'summary', d.summary, 'documentOn', d.document_on, 'createdAt', d.created_at
    ) order by d.created_at desc)
    from (
      select * from business_os.documents x
      where x.organization_id = org_id
        and x.upload_status <> 'orphaned'
        and (folder_path is null or x.folder = folder_path)
        and (with_tags is null or x.tags && with_tags)
      order by x.created_at desc
      limit least(greatest(coalesce(max_rows, 100), 1), 500)
    ) d
  ), '[]'::jsonb);
end;
$fn$;

create function business_os.get_document(actor_id uuid, document_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
  d business_os.documents;
begin
  org_id := business_os.assert_operations_reader(actor_id);
  select * into d from business_os.documents x where x.id = document_id and x.organization_id = org_id;
  if d.id is null then
    raise exception 'document_missing' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'id', d.id, 'title', d.title, 'folder', d.folder, 'origin', d.origin, 'category', d.category, 'vendor', d.vendor,
    'tags', d.tags, 'mimeType', d.mime_type, 'byteSize', d.byte_size, 'uploadStatus', d.upload_status,
    'summary', d.summary, 'documentOn', d.document_on, 'createdAt', d.created_at,
    'extractedText', left(d.extracted_text, 60000)
  );
end;
$fn$;

/* ---------- Agent activity ---------- */

create table business_os.agent_activity (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  actor_user_id uuid not null,
  token_kind text not null check (token_kind in ('read', 'write')),
  tool text not null check (char_length(tool) between 1 and 80),
  summary text check (char_length(summary) <= 500),
  outcome text not null check (outcome in ('ok', 'refused', 'failed')),
  error_code text check (char_length(error_code) <= 80),
  created_at timestamptz not null default now()
);

create index agent_activity_org_created_idx on business_os.agent_activity (organization_id, created_at desc);

alter table business_os.agent_activity enable row level security;
alter table business_os.agent_activity force row level security;

create policy agent_activity_select on business_os.agent_activity
for select to authenticated using (business_os.is_active_member(organization_id));

revoke all on business_os.agent_activity from public, anon, authenticated;
grant select on business_os.agent_activity to authenticated;

create function business_os.record_agent_activity(actor_id uuid, token_kind text, tool text, summary text, outcome text, error_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
begin
  org_id := business_os.assert_operations_reader(actor_id);
  insert into business_os.agent_activity (organization_id, actor_user_id, token_kind, tool, summary, outcome, error_code)
  values (org_id, actor_id, token_kind, left(tool, 80), left(nullif(summary, ''), 500), outcome, left(nullif(error_code, ''), 80));
end;
$fn$;

/* ---------- Grants: every function is service_role only ---------- */

do $do$
declare
  fn regprocedure;
begin
  foreach fn in array array[
    'business_os.task_json(business_os.tasks)'::regprocedure,
    'business_os.save_task(uuid, jsonb)'::regprocedure,
    'business_os.delete_task(uuid, uuid)'::regprocedure,
    'business_os.list_tasks(uuid, boolean)'::regprocedure,
    'business_os.list_calendar_events(uuid, date, date)'::regprocedure,
    'business_os.company_profile_json(business_os.legal_entities)'::regprocedure,
    'business_os.company_profile(uuid)'::regprocedure,
    'business_os.save_company_profile(uuid, jsonb)'::regprocedure,
    'business_os.list_documents(uuid, text, text[], integer)'::regprocedure,
    'business_os.get_document(uuid, uuid)'::regprocedure,
    'business_os.record_agent_activity(uuid, text, text, text, text, text)'::regprocedure
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end;
$do$;
