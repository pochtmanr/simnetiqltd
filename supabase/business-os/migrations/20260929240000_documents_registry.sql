-- M6 documents, registry, timeline, and reminder outbox.
-- Additive after 20260929210000_reconciliation.sql.
-- Recovery: drop the functions, view, and tables created below. Drop only the
-- address, notes, and updated_at columns added to legal_entities. Do not drop
-- legal_entities or the finance schema. Do not apply this file to the marketing
-- database. The identity migration already refuses that.

do $guard$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'marketing_contacts'
  ) then
    raise exception 'refusing Business OS migration: public.marketing_contacts is present';
  end if;
  if to_regclass('business_os.expenses') is null then
    raise exception 'finance_core_missing';
  end if;
end
$guard$;

alter table business_os.legal_entities
  add column if not exists address text,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now();

alter table business_os.legal_entities
  drop constraint if exists legal_entities_address_len,
  drop constraint if exists legal_entities_notes_len;

alter table business_os.legal_entities
  add constraint legal_entities_address_len check (address is null or char_length(address) between 1 and 300),
  add constraint legal_entities_notes_len check (notes is null or char_length(notes) <= 500);

create table business_os.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  origin text not null check (origin in ('central', 'source')),
  title text not null check (char_length(title) between 1 and 160),
  category text check (category is null or char_length(category) between 1 and 80),
  vendor text check (vendor is null or char_length(vendor) between 1 and 200),
  tags text[] not null default '{}',
  project_id uuid references business_os.projects (id),
  document_on date,
  object_path text,
  checksum_sha256 text,
  mime_type text,
  byte_size integer,
  upload_status text not null check (upload_status in ('pending', 'stored', 'orphaned', 'reference')),
  source_project_id uuid references business_os.projects (id),
  source_document_id text,
  source_provenance text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (object_path is null or (
    object_path ~ '^[a-z0-9][a-z0-9/_.-]{0,200}$'
    and object_path !~ '\.\.'
    and object_path !~ '://'
  )),
  check (checksum_sha256 is null or checksum_sha256 ~ '^[a-f0-9]{64}$'),
  check (source_provenance is null or (
    char_length(source_provenance) between 1 and 200
    and source_provenance !~ '://'
  )),
  check (source_document_id is null or source_document_id ~ '^[A-Za-z0-9_.:-]{1,160}$'),
  check (byte_size is null or (byte_size between 1 and 10485760)),
  check (mime_type is null or mime_type in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  check (
    (
      origin = 'source'
      and upload_status = 'reference'
      and object_path is null
      and checksum_sha256 is null
      and mime_type is null
      and byte_size is null
      and source_project_id is not null
      and source_document_id is not null
    )
    or (
      origin = 'central'
      and source_project_id is null
      and source_document_id is null
      and source_provenance is null
      and object_path is not null
      and (
        (upload_status in ('pending', 'orphaned') and checksum_sha256 is null)
        or (
          upload_status = 'stored'
          and checksum_sha256 is not null
          and mime_type is not null
          and byte_size is not null
        )
      )
    )
  )
);

create index documents_org_title_idx on business_os.documents (organization_id, title);
create index documents_org_document_on_idx on business_os.documents (organization_id, document_on);

create table business_os.service_registrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  legal_entity_id uuid references business_os.legal_entities (id),
  project_id uuid references business_os.projects (id),
  name text not null check (char_length(name) between 1 and 160),
  registration_reference text check (
    registration_reference is null or char_length(registration_reference) between 1 and 80
  ),
  renewal_on date,
  due_on date,
  notes text check (notes is null or char_length(notes) <= 500),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table business_os.timeline_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  project_id uuid references business_os.projects (id),
  title text not null check (char_length(title) between 1 and 160),
  occurs_on date not null,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index timeline_events_occurs_idx on business_os.timeline_events (organization_id, occurs_on);

create table business_os.document_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  document_id uuid not null references business_os.documents (id),
  target_kind text not null check (target_kind in ('expense', 'registration', 'timeline_event')),
  expense_id uuid references business_os.expenses (id),
  registration_id uuid references business_os.service_registrations (id),
  timeline_event_id uuid references business_os.timeline_events (id),
  created_at timestamptz not null default now(),
  check (
    (
      target_kind = 'expense'
      and expense_id is not null
      and registration_id is null
      and timeline_event_id is null
    )
    or (
      target_kind = 'registration'
      and registration_id is not null
      and expense_id is null
      and timeline_event_id is null
    )
    or (
      target_kind = 'timeline_event'
      and timeline_event_id is not null
      and expense_id is null
      and registration_id is null
    )
  )
);

create unique index document_links_expense_once
  on business_os.document_links (document_id, expense_id)
  where expense_id is not null;

create unique index document_links_registration_once
  on business_os.document_links (document_id, registration_id)
  where registration_id is not null;

create unique index document_links_event_once
  on business_os.document_links (document_id, timeline_event_id)
  where timeline_event_id is not null;

create table business_os.recurring_schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  project_id uuid references business_os.projects (id),
  vendor text check (vendor is null or char_length(vendor) between 1 and 200),
  category_id uuid references business_os.expense_categories (id),
  amount numeric not null check (amount > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  day_of_month integer not null check (day_of_month between 1 and 31),
  month_of_year integer check (month_of_year between 1 and 12),
  next_on date not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table business_os.recurrence_occurrences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  schedule_id uuid not null references business_os.recurring_schedules (id),
  due_on date not null,
  expense_id uuid not null references business_os.expenses (id),
  created_at timestamptz not null default now(),
  unique (schedule_id, due_on)
);

create table business_os.reminder_preferences (
  organization_id uuid primary key references business_os.organizations (id),
  consent boolean not null default false,
  quiet_start time not null default time '22:00',
  quiet_end time not null default time '07:00',
  lead_days integer[] not null default '{7,1}',
  updated_at timestamptz not null default now(),
  check (cardinality(lead_days) between 1 and 5),
  check (lead_days <@ array[1, 3, 7, 14, 30]::integer[])
);

create table business_os.reminder_recipients (
  organization_id uuid not null references business_os.organizations (id),
  telegram_user_id bigint not null check (telegram_user_id > 0),
  enabled boolean not null default true,
  primary key (organization_id, telegram_user_id)
);

create table business_os.reminder_occurrences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  occurrence_key text not null check (char_length(occurrence_key) between 1 and 200),
  channel text not null check (channel = 'telegram'),
  telegram_user_id bigint not null check (telegram_user_id > 0),
  title text not null check (char_length(title) between 1 and 120),
  link_path text not null check (link_path ~ '^/tg\?section=(documents|records|timeline|integrations)$'),
  due_on date not null,
  state text not null check (state in ('pending', 'leased', 'sent', 'failed', 'ambiguous', 'suppressed')),
  lease_until timestamptz,
  attempt_count integer not null default 0 check (attempt_count between 0 and 5),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reminder_occurrences_once unique (occurrence_key, channel, telegram_user_id),
  check (title !~ '[£$€]'),
  check (title !~ '[0-9]+\.[0-9]{2}')
);

create index reminder_occurrences_claim_idx
  on business_os.reminder_occurrences (due_on, id)
  where state in ('pending', 'failed', 'leased');

create table business_os.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  occurrence_id uuid not null references business_os.reminder_occurrences (id),
  attempt integer not null check (attempt >= 1),
  outcome text not null check (outcome in ('sent', 'failed', 'ambiguous', 'suppressed')),
  created_at timestamptz not null default now(),
  unique (occurrence_id, attempt)
);

insert into business_os.reminder_preferences (organization_id)
select id from business_os.organizations
on conflict (organization_id) do nothing;

create view business_os.timeline_items
with (security_invoker = true) as
  select
    e.organization_id,
    'finance_due'::text as kind,
    e.id as source_id,
    e.due_on as occurs_on,
    coalesce(e.vendor, 'Expense due') as title,
    e.project_id,
    false as editable
  from business_os.expenses e
  where e.workflow_kind = 'expense'
    and e.due_on is not null
    and e.paid_on is null
    and e.status <> 'reversed'
  union all
  select
    s.organization_id,
    'recurring_expectation',
    s.id,
    s.next_on,
    coalesce(s.vendor, 'Recurring expense'),
    s.project_id,
    false
  from business_os.recurring_schedules s
  where s.active
  union all
  select
    r.organization_id,
    'service_renewal',
    r.id,
    r.renewal_on,
    r.name,
    r.project_id,
    false
  from business_os.service_registrations r
  where r.renewal_on is not null
  union all
  select
    r.organization_id,
    'service_due',
    r.id,
    r.due_on,
    r.name,
    r.project_id,
    false
  from business_os.service_registrations r
  where r.due_on is not null
    and r.due_on is distinct from r.renewal_on
  union all
  select
    t.organization_id,
    'manual',
    t.id,
    t.occurs_on,
    t.title,
    t.project_id,
    true
  from business_os.timeline_events t;

create function business_os.assert_operations_reader(actor_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
begin
  select m.organization_id into org_id
  from business_os.memberships m
  where m.user_id = actor_id
    and m.revoked_at is null
  limit 1;
  if org_id is null then
    raise exception 'membership_missing' using errcode = '42501';
  end if;
  return org_id;
end;
$fn$;

create function business_os.assert_operations_writer(actor_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
begin
  select m.organization_id into org_id
  from business_os.memberships m
  where m.user_id = actor_id
    and m.role in ('owner', 'admin')
    and m.revoked_at is null
  limit 1;
  if org_id is null then
    raise exception 'reader_forbidden' using errcode = '42501';
  end if;
  return org_id;
end;
$fn$;

create function business_os.assert_operations_owner(actor_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
begin
  select m.organization_id into org_id
  from business_os.memberships m
  where m.user_id = actor_id
    and m.role = 'owner'
    and m.revoked_at is null
  limit 1;
  if org_id is null then
    raise exception 'owner_required' using errcode = '42501';
  end if;
  return org_id;
end;
$fn$;

create function business_os.reject_secret_notes(notes text)
returns void
language plpgsql
immutable
set search_path = ''
as $fn$
begin
  if notes is not null and notes ~* '(password|passwd|secret|api[_ -]?key|token)\s*[:=]' then
    raise exception 'notes_rejected' using errcode = '22023';
  end if;
end;
$fn$;

create function business_os.clamp_civil_date(year_n integer, month_n integer, day_n integer)
returns date
language plpgsql
immutable
set search_path = ''
as $fn$
declare
  last_day integer;
begin
  if month_n < 1 or month_n > 12 or day_n < 1 or day_n > 31 then
    raise exception 'schedule_invalid' using errcode = '22023';
  end if;
  last_day := extract(day from (make_date(year_n, month_n, 1) + interval '1 month' - interval '1 day'))::integer;
  return make_date(year_n, month_n, least(day_n, last_day));
end;
$fn$;

create function business_os.advance_schedule(current_on date, day_of_month integer, month_of_year integer)
returns date
language plpgsql
immutable
set search_path = ''
as $fn$
declare
  year_n integer;
  month_n integer;
begin
  if month_of_year is null then
    month_n := extract(month from current_on)::integer + 1;
    year_n := extract(year from current_on)::integer;
    if month_n = 13 then
      month_n := 1;
      year_n := year_n + 1;
    end if;
  else
    year_n := extract(year from current_on)::integer + 1;
    month_n := month_of_year;
  end if;
  return business_os.clamp_civil_date(year_n, month_n, day_of_month);
end;
$fn$;

create function business_os.in_quiet_hours(local_time time, quiet_start time, quiet_end time)
returns boolean
language sql
immutable
set search_path = ''
as $fn$
  select case
    when quiet_start = quiet_end then false
    when quiet_start < quiet_end then local_time >= quiet_start and local_time < quiet_end
    else local_time >= quiet_start or local_time < quiet_end
  end;
$fn$;

create function business_os.project_in_org(org_id uuid, slug text)
returns uuid
language sql
stable
set search_path = ''
as $fn$
  select p.id
  from business_os.projects p
  where p.organization_id = org_id
    and p.slug = slug;
$fn$;

create function business_os.register_upload(actor_id uuid, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
  doc_id uuid;
  object_path text;
  tag text;
  project_id uuid;
begin
  org_id := business_os.assert_operations_writer(actor_id);
  if payload ->> 'title' is null or char_length(payload ->> 'title') not between 1 and 160 then
    raise exception 'title_invalid' using errcode = '22023';
  end if;
  if payload ? 'mime_type' and payload ->> 'mime_type' not in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp') then
    raise exception 'mime_invalid' using errcode = '22023';
  end if;
  if payload ? 'byte_size' and (payload ->> 'byte_size')::integer > 10485760 then
    raise exception 'document_too_large' using errcode = '22023';
  end if;
  if jsonb_typeof(payload -> 'tags') = 'array' then
    if jsonb_array_length(payload -> 'tags') > 12 then
      raise exception 'tag_invalid' using errcode = '22023';
    end if;
    for tag in select jsonb_array_elements_text(payload -> 'tags')
    loop
      if tag !~ '^[a-z0-9][a-z0-9-]{0,31}$' then
        raise exception 'tag_invalid' using errcode = '22023';
      end if;
    end loop;
  end if;
  if nullif(payload ->> 'project_slug', '') is not null then
    project_id := business_os.project_in_org(org_id, payload ->> 'project_slug');
    if project_id is null then
      raise exception 'project_missing' using errcode = '22023';
    end if;
  end if;
  doc_id := gen_random_uuid();
  object_path := replace(org_id::text, '-', '') || '/' || replace(doc_id::text, '-', '');
  insert into business_os.documents (
    id, organization_id, origin, title, category, vendor, tags, project_id, document_on,
    object_path, upload_status, created_by
  ) values (
    doc_id,
    org_id,
    'central',
    payload ->> 'title',
    nullif(payload ->> 'category', ''),
    nullif(payload ->> 'vendor', ''),
    coalesce(
      (
        select array_agg(value)
        from jsonb_array_elements_text(coalesce(payload -> 'tags', '[]'::jsonb)) as value
      ),
      '{}'
    ),
    project_id,
    business_os.parse_date(nullif(payload ->> 'document_on', '')),
    object_path,
    'pending',
    actor_id
  );
  return jsonb_build_object('id', doc_id, 'objectPath', object_path);
end;
$fn$;

create function business_os.complete_upload(
  actor_id uuid,
  document_id uuid,
  checksum text,
  mime_type text,
  byte_size integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  org_id uuid;
  doc business_os.documents%rowtype;
begin
  org_id := business_os.assert_operations_writer(actor_id);
  if checksum !~ '^[a-f0-9]{64}$' then
    raise exception 'checksum_invalid' using errcode = '22023';
  end if;
  if mime_type not in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp') then
    raise exception 'mime_invalid' using errcode = '22023';
  end if;
  if byte_size is null or byte_size < 1 or byte_size > 10485760 then
    raise exception 'document_too_large' using errcode = '22023';
  end if;
  select * into doc
  from business_os.documents d
  where d.id = document_id
    and d.organization_id = org_id
  for update;
  if doc.id is null then
    raise exception 'document_missing' using errcode = '42501';
  end if;
  if doc.origin <> 'central' then
    raise exception 'source_not_expense' using errcode = '22023';
  end if;
  if doc.upload_status = 'stored' then
    if doc.checksum_sha256 = checksum then
      return doc.id;
    end if;
    raise exception 'checksum_invalid' using errcode = '22023';
  end if;
  if doc.upload_status <> 'pending' then
    raise exception 'upload_incomplete' using errcode = '22023';
  end if;
  update business_os.documents
  set checksum_sha256 = checksum,
      mime_type = complete_upload.mime_type,
      byte_size = complete_upload.byte_size,
      upload_status = 'stored',
      updated_at = now()
  where id = doc.id;
  return doc.id;
end;
$fn$;

create function business_os.attach_document(actor_id uuid, document_id uuid, expense_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
  doc business_os.documents%rowtype;
  expense business_os.expenses%rowtype;
  before_count integer;
begin
  org_id := business_os.assert_operations_writer(actor_id);
  select count(*) into before_count from business_os.expenses where organization_id = org_id;
  select * into doc
  from business_os.documents d
  where d.id = document_id
    and d.organization_id = org_id;
  if doc.id is null then
    raise exception 'document_missing' using errcode = '42501';
  end if;
  if doc.origin <> 'central' or doc.upload_status <> 'stored' then
    raise exception 'upload_incomplete' using errcode = '22023';
  end if;
  select * into expense
  from business_os.expenses e
  where e.id = expense_id
    and e.organization_id = org_id;
  if expense.id is null then
    raise exception 'expense_missing' using errcode = '42501';
  end if;
  if expense.source_owner <> 'simnetiq' then
    raise exception 'source_expense_readonly' using errcode = '42501';
  end if;
  if exists (
    select 1 from business_os.document_links l
    where l.document_id = doc.id and l.expense_id = expense.id
  ) then
    return doc.id;
  end if;
  insert into business_os.document_links (organization_id, document_id, target_kind, expense_id)
  values (org_id, doc.id, 'expense', expense.id);
  insert into business_os.expense_receipts (organization_id, expense_id, object_path, checksum_sha256)
  select org_id, expense.id, doc.object_path, doc.checksum_sha256
  where not exists (
    select 1
    from business_os.expense_receipts r
    where r.expense_id = expense.id
      and r.object_path = doc.object_path
  );
  if (select count(*) from business_os.expenses where organization_id = org_id) <> before_count then
    raise exception 'source_not_expense' using errcode = '22023';
  end if;
  return doc.id;
end;
$fn$;

create function business_os.import_source_document(actor_id uuid, payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
  doc_id uuid;
  project_id uuid;
  before_expenses integer;
  before_entries integer;
begin
  org_id := business_os.assert_operations_writer(actor_id);
  if payload ->> 'title' is null or char_length(payload ->> 'title') not between 1 and 160 then
    raise exception 'title_invalid' using errcode = '22023';
  end if;
  if payload ->> 'source_document_id' !~ '^[A-Za-z0-9_.:-]{1,160}$' then
    raise exception 'document_missing' using errcode = '22023';
  end if;
  if payload ->> 'source_provenance' is null
     or char_length(payload ->> 'source_provenance') not between 1 and 200
     or payload ->> 'source_provenance' ~ '://' then
    raise exception 'public_link_rejected' using errcode = '22023';
  end if;
  project_id := business_os.project_in_org(org_id, payload ->> 'project_slug');
  if project_id is null then
    raise exception 'project_missing' using errcode = '22023';
  end if;
  select count(*) into before_expenses from business_os.expenses;
  select count(*) into before_entries from business_os.financial_entries;
  insert into business_os.documents (
    organization_id, origin, title, category, vendor, project_id, document_on,
    upload_status, source_project_id, source_document_id, source_provenance, created_by
  ) values (
    org_id,
    'source',
    payload ->> 'title',
    nullif(payload ->> 'category', ''),
    nullif(payload ->> 'vendor', ''),
    project_id,
    business_os.parse_date(nullif(payload ->> 'document_on', '')),
    'reference',
    project_id,
    payload ->> 'source_document_id',
    payload ->> 'source_provenance',
    actor_id
  )
  returning id into doc_id;
  if (select count(*) from business_os.expenses) <> before_expenses
     or (select count(*) from business_os.financial_entries) <> before_entries then
    raise exception 'source_not_expense' using errcode = '22023';
  end if;
  return doc_id;
end;
$fn$;

create function business_os.quarantine_orphan_uploads()
returns integer
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  removed integer;
begin
  update business_os.documents d
  set upload_status = 'orphaned',
      updated_at = now()
  where d.origin = 'central'
    and d.upload_status = 'pending'
    and d.created_at < now() - interval '24 hours'
    and not exists (
      select 1 from business_os.document_links l where l.document_id = d.id
    );
  get diagnostics removed = row_count;
  return removed;
end;
$fn$;

create function business_os.authorize_document(actor_id uuid, document_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
  doc business_os.documents%rowtype;
begin
  org_id := business_os.assert_operations_reader(actor_id);
  select * into doc
  from business_os.documents d
  where d.id = document_id
    and d.organization_id = org_id;
  if doc.id is null then
    raise exception 'document_missing' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'id', doc.id,
    'origin', doc.origin,
    'uploadStatus', doc.upload_status,
    'mimeType', doc.mime_type,
    'objectPath', doc.object_path,
    'sourceDocumentId', doc.source_document_id
  );
end;
$fn$;

create function business_os.save_legal_entity(actor_id uuid, payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
  entity_id uuid;
begin
  org_id := business_os.assert_operations_writer(actor_id);
  perform business_os.reject_secret_notes(payload ->> 'notes');
  if payload ->> 'legal_name' is null or char_length(payload ->> 'legal_name') not between 1 and 200 then
    raise exception 'title_invalid' using errcode = '22023';
  end if;
  if nullif(payload ->> 'id', '') is not null then
    update business_os.legal_entities
    set legal_name = payload ->> 'legal_name',
        jurisdiction = nullif(payload ->> 'jurisdiction', ''),
        registration_reference = nullif(payload ->> 'registration_reference', ''),
        tax_reference = nullif(payload ->> 'tax_reference', ''),
        address = nullif(payload ->> 'address', ''),
        notes = nullif(payload ->> 'notes', ''),
        updated_at = now()
    where id = (payload ->> 'id')::uuid
      and organization_id = org_id
    returning id into entity_id;
    if entity_id is null then
      raise exception 'document_missing' using errcode = '42501';
    end if;
    return entity_id;
  end if;
  insert into business_os.legal_entities (
    organization_id, legal_name, jurisdiction, registration_reference, tax_reference, address, notes
  ) values (
    org_id,
    payload ->> 'legal_name',
    nullif(payload ->> 'jurisdiction', ''),
    nullif(payload ->> 'registration_reference', ''),
    nullif(payload ->> 'tax_reference', ''),
    nullif(payload ->> 'address', ''),
    nullif(payload ->> 'notes', '')
  )
  returning id into entity_id;
  return entity_id;
end;
$fn$;

create function business_os.save_service_registration(actor_id uuid, payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
  registration_id uuid;
  project_id uuid;
  entity_id uuid;
begin
  org_id := business_os.assert_operations_writer(actor_id);
  perform business_os.reject_secret_notes(payload ->> 'notes');
  if payload ->> 'name' is null or char_length(payload ->> 'name') not between 1 and 160 then
    raise exception 'title_invalid' using errcode = '22023';
  end if;
  if nullif(payload ->> 'project_slug', '') is not null then
    project_id := business_os.project_in_org(org_id, payload ->> 'project_slug');
    if project_id is null then
      raise exception 'project_missing' using errcode = '22023';
    end if;
  end if;
  if nullif(payload ->> 'legal_entity_id', '') is not null then
    select e.id into entity_id
    from business_os.legal_entities e
    where e.id = (payload ->> 'legal_entity_id')::uuid
      and e.organization_id = org_id;
    if entity_id is null then
      raise exception 'document_missing' using errcode = '42501';
    end if;
  end if;
  insert into business_os.service_registrations (
    organization_id, legal_entity_id, project_id, name, registration_reference, renewal_on, due_on, notes, created_by
  ) values (
    org_id,
    entity_id,
    project_id,
    payload ->> 'name',
    nullif(payload ->> 'registration_reference', ''),
    business_os.parse_date(nullif(payload ->> 'renewal_on', '')),
    business_os.parse_date(nullif(payload ->> 'due_on', '')),
    nullif(payload ->> 'notes', ''),
    actor_id
  )
  returning id into registration_id;
  return registration_id;
end;
$fn$;

create function business_os.create_timeline_event(actor_id uuid, payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
  event_id uuid;
  project_id uuid;
begin
  org_id := business_os.assert_operations_writer(actor_id);
  if payload ->> 'title' is null or char_length(payload ->> 'title') not between 1 and 160 then
    raise exception 'title_invalid' using errcode = '22023';
  end if;
  if payload ->> 'title' ~ '[£$€]|[0-9]+\.[0-9]{2}' then
    raise exception 'title_invalid' using errcode = '22023';
  end if;
  if nullif(payload ->> 'project_slug', '') is not null then
    project_id := business_os.project_in_org(org_id, payload ->> 'project_slug');
    if project_id is null then
      raise exception 'project_missing' using errcode = '22023';
    end if;
  end if;
  insert into business_os.timeline_events (organization_id, project_id, title, occurs_on, created_by)
  values (
    org_id,
    project_id,
    payload ->> 'title',
    business_os.parse_date(payload ->> 'occurs_on'),
    actor_id
  )
  returning id into event_id;
  return event_id;
end;
$fn$;

create function business_os.create_recurring_schedule(actor_id uuid, payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
  schedule_id uuid;
  project_id uuid;
  day_n integer;
  month_n integer;
  starts_on date;
  first_on date;
  amount numeric;
begin
  org_id := business_os.assert_operations_writer(actor_id);
  if payload ->> 'source_owner' = 'project' then
    raise exception 'source_expense_readonly' using errcode = '42501';
  end if;
  perform business_os.reject_json_number(payload, 'amount');
  amount := business_os.parse_amount(payload ->> 'amount', payload ->> 'currency', null, null);
  day_n := (payload ->> 'day_of_month')::integer;
  if payload ->> 'month_of_year' is null or payload ->> 'month_of_year' = '' then
    month_n := null;
  else
    month_n := (payload ->> 'month_of_year')::integer;
  end if;
  if day_n is null or day_n < 1 or day_n > 31 then
    raise exception 'schedule_invalid' using errcode = '22023';
  end if;
  if month_n is not null and (month_n < 1 or month_n > 12) then
    raise exception 'schedule_invalid' using errcode = '22023';
  end if;
  starts_on := business_os.parse_date(payload ->> 'starts_on');
  if starts_on is null then
    raise exception 'date_invalid' using errcode = '22023';
  end if;
  if nullif(payload ->> 'project_slug', '') is not null then
    project_id := business_os.project_in_org(org_id, payload ->> 'project_slug');
    if project_id is null then
      raise exception 'project_missing' using errcode = '22023';
    end if;
  end if;
  first_on := business_os.clamp_civil_date(
    extract(year from starts_on)::integer,
    coalesce(month_n, extract(month from starts_on)::integer),
    day_n
  );
  if first_on < starts_on then
    first_on := business_os.advance_schedule(first_on, day_n, month_n);
  end if;
  insert into business_os.recurring_schedules (
    organization_id, project_id, vendor, amount, currency, day_of_month, month_of_year, next_on
  ) values (
    org_id,
    project_id,
    nullif(payload ->> 'vendor', ''),
    amount,
    payload ->> 'currency',
    day_n,
    month_n,
    first_on
  )
  returning id into schedule_id;
  return schedule_id;
end;
$fn$;

create function business_os.materialize_recurring_drafts(as_of text)
returns integer
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  as_of_date date;
  schedule business_os.recurring_schedules%rowtype;
  new_expense uuid;
  steps integer;
  created integer := 0;
begin
  as_of_date := business_os.parse_date(as_of);
  if as_of_date is null then
    raise exception 'date_invalid' using errcode = '22023';
  end if;
  for schedule in
    select *
    from business_os.recurring_schedules s
    where s.active
      and s.next_on <= as_of_date
    order by s.next_on
    for update
  loop
    steps := 0;
    while schedule.next_on <= as_of_date and steps < 36 loop
      begin
        insert into business_os.expenses (
          organization_id, workflow_kind, source_owner, project_id, status, vendor,
          category_id, due_on, amount, currency
        ) values (
          schedule.organization_id,
          'expense',
          'simnetiq',
          schedule.project_id,
          'draft',
          schedule.vendor,
          schedule.category_id,
          schedule.next_on,
          schedule.amount,
          schedule.currency
        )
        returning id into new_expense;
        insert into business_os.recurrence_occurrences (organization_id, schedule_id, due_on, expense_id)
        values (schedule.organization_id, schedule.id, schedule.next_on, new_expense);
        created := created + 1;
      exception
        when unique_violation then
          null;
      end;
      schedule.next_on := business_os.advance_schedule(schedule.next_on, schedule.day_of_month, schedule.month_of_year);
      steps := steps + 1;
    end loop;
    update business_os.recurring_schedules
    set next_on = schedule.next_on
    where id = schedule.id;
  end loop;
  return created;
end;
$fn$;

create function business_os.save_reminder_preferences(actor_id uuid, payload jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
  leads integer[];
begin
  org_id := business_os.assert_operations_owner(actor_id);
  if jsonb_typeof(payload -> 'lead_days') <> 'array' then
    raise exception 'schedule_invalid' using errcode = '22023';
  end if;
  select array_agg(distinct value::integer) into leads
  from jsonb_array_elements_text(payload -> 'lead_days') as value;
  if leads is null or cardinality(leads) < 1 then
    raise exception 'schedule_invalid' using errcode = '22023';
  end if;
  insert into business_os.reminder_preferences (organization_id, consent, quiet_start, quiet_end, lead_days)
  values (
    org_id,
    coalesce((payload ->> 'consent')::boolean, false),
    coalesce((payload ->> 'quiet_start')::time, time '22:00'),
    coalesce((payload ->> 'quiet_end')::time, time '07:00'),
    leads
  )
  on conflict (organization_id) do update set
    consent = excluded.consent,
    quiet_start = excluded.quiet_start,
    quiet_end = excluded.quiet_end,
    lead_days = excluded.lead_days,
    updated_at = now();
end;
$fn$;

create function business_os.set_reminder_recipient(actor_id uuid, telegram_user_id bigint, enabled boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  org_id uuid;
begin
  org_id := business_os.assert_operations_owner(actor_id);
  if not exists (
    select 1
    from business_os.telegram_identities t
    join business_os.memberships m on m.user_id = t.user_id and m.organization_id = t.organization_id
    where t.organization_id = org_id
      and t.telegram_user_id = set_reminder_recipient.telegram_user_id
      and t.revoked_at is null
      and m.revoked_at is null
  ) then
    raise exception 'recipient_unlinked' using errcode = '42501';
  end if;
  insert into business_os.reminder_recipients (organization_id, telegram_user_id, enabled)
  values (org_id, telegram_user_id, enabled)
  on conflict (organization_id, telegram_user_id) do update set
    enabled = excluded.enabled;
end;
$fn$;

create function business_os.enqueue_reminders(as_of text)
returns integer
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  as_of_date date;
  inserted integer := 0;
  step_count integer;
begin
  as_of_date := business_os.parse_date(as_of);
  if as_of_date is null then
    raise exception 'date_invalid' using errcode = '22023';
  end if;

  insert into business_os.reminder_occurrences (
    organization_id, occurrence_key, channel, telegram_user_id, title, link_path, due_on, state
  )
  select
    item.organization_id,
    item.kind || ':' || item.source_id::text || ':' || item.occurs_on::text || ':lead:' || lead_window.lead::text,
    'telegram',
    recipient.telegram_user_id,
    case
      when item.title ~ '[£$€]|[0-9]+\.[0-9]{2}' then
        case item.kind
          when 'finance_due' then 'Expense due'
          when 'recurring_expectation' then 'Recurring expense'
          when 'service_renewal' then 'Service renewal'
          when 'service_due' then 'Service due'
          else 'Scheduled item'
        end
      else left(item.title, 120)
    end,
    case
      when item.kind in ('service_renewal', 'service_due') then '/tg?section=records'
      else '/tg?section=timeline'
    end,
    item.occurs_on,
    'pending'
  from business_os.timeline_items item
  join business_os.reminder_preferences prefs on prefs.organization_id = item.organization_id
  join lateral (
    select
      lead,
      coalesce((
        select max(smaller)
        from unnest(prefs.lead_days) as smaller
        where smaller < lead
      ), -1) as lower_bound
    from unnest(prefs.lead_days) as lead
  ) lead_window on (item.occurs_on - as_of_date) <= lead_window.lead
    and (item.occurs_on - as_of_date) > lead_window.lower_bound
  join (
    select distinct r.organization_id, r.telegram_user_id
    from business_os.reminder_recipients r
    join business_os.telegram_identities t
      on t.organization_id = r.organization_id
     and t.telegram_user_id = r.telegram_user_id
     and t.revoked_at is null
    join business_os.memberships m
      on m.user_id = t.user_id
     and m.organization_id = r.organization_id
     and m.revoked_at is null
    where r.enabled
  ) recipient on recipient.organization_id = item.organization_id
  where prefs.consent
  on conflict on constraint reminder_occurrences_once do nothing;
  get diagnostics step_count = row_count;
  inserted := inserted + step_count;

  if to_regclass('business_os.source_health') is not null then
    insert into business_os.reminder_occurrences (
      organization_id, occurrence_key, channel, telegram_user_id, title, link_path, due_on, state
    )
    select
      h.organization_id,
      'health:' || h.connection_id::text || ':' || case when h.status <> 'ok' then h.status else 'stale' end,
      'telegram',
      recipient.telegram_user_id,
      'Source needs attention',
      '/tg?section=integrations',
      as_of_date,
      'pending'
    from business_os.source_health h
    join business_os.reminder_preferences prefs on prefs.organization_id = h.organization_id and prefs.consent
    join (
      select distinct r.organization_id, r.telegram_user_id
      from business_os.reminder_recipients r
      where r.enabled
    ) recipient on recipient.organization_id = h.organization_id
    where h.status <> 'ok'
       or (h.last_success_at is not null and h.last_success_at < now() - interval '36 hours')
    on conflict on constraint reminder_occurrences_once do nothing;
    get diagnostics step_count = row_count;
    inserted := inserted + step_count;
  end if;

  if to_regclass('business_os.import_quarantine') is not null then
    insert into business_os.reminder_occurrences (
      organization_id, occurrence_key, channel, telegram_user_id, title, link_path, due_on, state
    )
    select
      q.organization_id,
      'quarantine:' || q.connection_id::text || ':' || q.endpoint || ':' || q.reason,
      'telegram',
      recipient.telegram_user_id,
      'Import needs attention',
      '/tg?section=integrations',
      as_of_date,
      'pending'
    from business_os.import_quarantine q
    join business_os.reminder_preferences prefs on prefs.organization_id = q.organization_id and prefs.consent
    join (
      select distinct r.organization_id, r.telegram_user_id
      from business_os.reminder_recipients r
      where r.enabled
    ) recipient on recipient.organization_id = q.organization_id
    on conflict on constraint reminder_occurrences_once do nothing;
    get diagnostics step_count = row_count;
    inserted := inserted + step_count;
  end if;

  if to_regclass('business_os.reconciliation_runs') is not null then
    insert into business_os.reminder_occurrences (
      organization_id, occurrence_key, channel, telegram_user_id, title, link_path, due_on, state
    )
    select
      run.organization_id,
      'mismatch:' || run.project_id::text || ':' || run.dataset,
      'telegram',
      recipient.telegram_user_id,
      'Reconciliation needs attention',
      '/tg?section=integrations',
      as_of_date,
      'pending'
    from business_os.reconciliation_runs run
    join business_os.reminder_preferences prefs on prefs.organization_id = run.organization_id and prefs.consent
    join (
      select distinct r.organization_id, r.telegram_user_id
      from business_os.reminder_recipients r
      where r.enabled
    ) recipient on recipient.organization_id = run.organization_id
    where run.status = 'mismatch'
    on conflict on constraint reminder_occurrences_once do nothing;
    get diagnostics step_count = row_count;
    inserted := inserted + step_count;
  end if;

  return inserted;
end;
$fn$;

create function business_os.claim_reminders(local_time text, batch_limit integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  result jsonb;
begin
  if local_time !~ '^[0-2][0-9]:[0-5][0-9]$' or batch_limit < 1 or batch_limit > 50 then
    raise exception 'schedule_invalid' using errcode = '22023';
  end if;
  update business_os.reminder_occurrences
  set state = 'ambiguous',
      last_error = 'lease_expired',
      updated_at = now()
  where state = 'leased'
    and lease_until is not null
    and lease_until < now();

  with picked as (
    select o.id
    from business_os.reminder_occurrences o
    join business_os.reminder_preferences p on p.organization_id = o.organization_id
    where o.state in ('pending', 'failed')
      and o.attempt_count < 5
      and p.consent
      and not business_os.in_quiet_hours(local_time::time, p.quiet_start, p.quiet_end)
    order by o.due_on, o.id
    limit batch_limit
    for update of o skip locked
  ),
  updated as (
    update business_os.reminder_occurrences o
    set state = 'leased',
        lease_until = now() + interval '2 minutes',
        attempt_count = o.attempt_count + 1,
        updated_at = now()
    from picked
    where o.id = picked.id
    returning o.id, o.title, o.link_path, o.telegram_user_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', updated.id,
    'title', updated.title,
    'path', updated.link_path,
    'chatId', updated.telegram_user_id::text
  )), '[]'::jsonb)
  into result
  from updated;
  return result;
end;
$fn$;

create function business_os.finish_reminder(occurrence_id uuid, outcome text)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  occ business_os.reminder_occurrences%rowtype;
begin
  if outcome not in ('sent', 'failed', 'ambiguous', 'suppressed') then
    raise exception 'schedule_invalid' using errcode = '22023';
  end if;
  select * into occ
  from business_os.reminder_occurrences o
  where o.id = occurrence_id
  for update;
  if occ.id is null or occ.state <> 'leased' then
    raise exception 'lease_lost' using errcode = '40001';
  end if;
  update business_os.reminder_occurrences
  set state = outcome,
      lease_until = null,
      last_error = case when outcome = 'sent' then null else outcome end,
      updated_at = now()
  where id = occ.id;
  insert into business_os.notification_deliveries (organization_id, occurrence_id, attempt, outcome)
  values (occ.organization_id, occ.id, greatest(occ.attempt_count, 1), outcome);
end;
$fn$;

alter table business_os.documents enable row level security;
alter table business_os.documents force row level security;
alter table business_os.service_registrations enable row level security;
alter table business_os.service_registrations force row level security;
alter table business_os.timeline_events enable row level security;
alter table business_os.timeline_events force row level security;
alter table business_os.document_links enable row level security;
alter table business_os.document_links force row level security;
alter table business_os.recurring_schedules enable row level security;
alter table business_os.recurring_schedules force row level security;
alter table business_os.recurrence_occurrences enable row level security;
alter table business_os.recurrence_occurrences force row level security;
alter table business_os.reminder_preferences enable row level security;
alter table business_os.reminder_preferences force row level security;
alter table business_os.reminder_recipients enable row level security;
alter table business_os.reminder_recipients force row level security;
alter table business_os.reminder_occurrences enable row level security;
alter table business_os.reminder_occurrences force row level security;
alter table business_os.notification_deliveries enable row level security;
alter table business_os.notification_deliveries force row level security;

create policy documents_select on business_os.documents
for select to authenticated using (business_os.is_active_member(organization_id));
create policy service_registrations_select on business_os.service_registrations
for select to authenticated using (business_os.is_active_member(organization_id));
create policy timeline_events_select on business_os.timeline_events
for select to authenticated using (business_os.is_active_member(organization_id));
create policy document_links_select on business_os.document_links
for select to authenticated using (business_os.is_active_member(organization_id));
create policy recurring_schedules_select on business_os.recurring_schedules
for select to authenticated using (business_os.is_active_member(organization_id));
create policy recurrence_occurrences_select on business_os.recurrence_occurrences
for select to authenticated using (business_os.is_active_member(organization_id));
create policy reminder_preferences_select on business_os.reminder_preferences
for select to authenticated using (business_os.is_active_member(organization_id));
create policy reminder_recipients_select on business_os.reminder_recipients
for select to authenticated using (business_os.is_active_member(organization_id));
create policy reminder_occurrences_select on business_os.reminder_occurrences
for select to authenticated using (business_os.is_active_member(organization_id));
create policy notification_deliveries_select on business_os.notification_deliveries
for select to authenticated using (business_os.is_active_member(organization_id));

revoke all on
  business_os.documents,
  business_os.service_registrations,
  business_os.timeline_events,
  business_os.document_links,
  business_os.recurring_schedules,
  business_os.recurrence_occurrences,
  business_os.reminder_preferences,
  business_os.reminder_recipients,
  business_os.reminder_occurrences,
  business_os.notification_deliveries
from public, anon;
grant select on
  business_os.documents,
  business_os.service_registrations,
  business_os.timeline_events,
  business_os.document_links,
  business_os.recurring_schedules,
  business_os.recurrence_occurrences,
  business_os.reminder_preferences,
  business_os.reminder_recipients,
  business_os.reminder_occurrences,
  business_os.notification_deliveries,
  business_os.timeline_items
to authenticated;
revoke insert, update, delete, truncate on
  business_os.documents,
  business_os.service_registrations,
  business_os.timeline_events,
  business_os.document_links,
  business_os.recurring_schedules,
  business_os.recurrence_occurrences,
  business_os.reminder_preferences,
  business_os.reminder_recipients,
  business_os.reminder_occurrences,
  business_os.notification_deliveries
from authenticated;

revoke all on function business_os.assert_operations_reader(uuid) from public, anon, authenticated;
revoke all on function business_os.assert_operations_writer(uuid) from public, anon, authenticated;
revoke all on function business_os.assert_operations_owner(uuid) from public, anon, authenticated;
revoke all on function business_os.reject_secret_notes(text) from public, anon, authenticated;
revoke all on function business_os.clamp_civil_date(integer, integer, integer) from public, anon, authenticated;
revoke all on function business_os.advance_schedule(date, integer, integer) from public, anon, authenticated;
revoke all on function business_os.in_quiet_hours(time, time, time) from public, anon, authenticated;
revoke all on function business_os.project_in_org(uuid, text) from public, anon, authenticated;
revoke all on function business_os.register_upload(uuid, jsonb) from public, anon, authenticated;
revoke all on function business_os.complete_upload(uuid, uuid, text, text, integer) from public, anon, authenticated;
revoke all on function business_os.attach_document(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function business_os.import_source_document(uuid, jsonb) from public, anon, authenticated;
revoke all on function business_os.quarantine_orphan_uploads() from public, anon, authenticated;
revoke all on function business_os.authorize_document(uuid, uuid) from public, anon, authenticated;
revoke all on function business_os.save_legal_entity(uuid, jsonb) from public, anon, authenticated;
revoke all on function business_os.save_service_registration(uuid, jsonb) from public, anon, authenticated;
revoke all on function business_os.create_timeline_event(uuid, jsonb) from public, anon, authenticated;
revoke all on function business_os.create_recurring_schedule(uuid, jsonb) from public, anon, authenticated;
revoke all on function business_os.materialize_recurring_drafts(text) from public, anon, authenticated;
revoke all on function business_os.save_reminder_preferences(uuid, jsonb) from public, anon, authenticated;
revoke all on function business_os.set_reminder_recipient(uuid, bigint, boolean) from public, anon, authenticated;
revoke all on function business_os.enqueue_reminders(text) from public, anon, authenticated;
revoke all on function business_os.claim_reminders(text, integer) from public, anon, authenticated;
revoke all on function business_os.finish_reminder(uuid, text) from public, anon, authenticated;

grant execute on function business_os.register_upload(uuid, jsonb) to service_role;
grant execute on function business_os.complete_upload(uuid, uuid, text, text, integer) to service_role;
grant execute on function business_os.attach_document(uuid, uuid, uuid) to service_role;
grant execute on function business_os.import_source_document(uuid, jsonb) to service_role;
grant execute on function business_os.quarantine_orphan_uploads() to service_role;
grant execute on function business_os.authorize_document(uuid, uuid) to service_role;
grant execute on function business_os.save_legal_entity(uuid, jsonb) to service_role;
grant execute on function business_os.save_service_registration(uuid, jsonb) to service_role;
grant execute on function business_os.create_timeline_event(uuid, jsonb) to service_role;
grant execute on function business_os.create_recurring_schedule(uuid, jsonb) to service_role;
grant execute on function business_os.materialize_recurring_drafts(text) to service_role;
grant execute on function business_os.save_reminder_preferences(uuid, jsonb) to service_role;
grant execute on function business_os.set_reminder_recipient(uuid, bigint, boolean) to service_role;
grant execute on function business_os.enqueue_reminders(text) to service_role;
grant execute on function business_os.claim_reminders(text, integer) to service_role;
grant execute on function business_os.finish_reminder(uuid, text) to service_role;

do $storage$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'storage'
      and table_name = 'buckets'
  ) then
    insert into storage.buckets (id, name, public)
    values ('business-os-documents', 'business-os-documents', false)
    on conflict (id) do nothing;
  end if;

  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'storage'
      and c.relname = 'objects'
      and pg_catalog.pg_get_userbyid(c.relowner) = current_user
  ) then
    execute 'alter table storage.objects enable row level security';
    begin
      execute $policy$
        create policy business_os_documents_deny on storage.objects
        as restrictive
        for all
        to anon, authenticated
        using (bucket_id is distinct from 'business-os-documents')
        with check (bucket_id is distinct from 'business-os-documents')
      $policy$;
    exception
      when duplicate_object then
        null;
    end;
  end if;
end
$storage$;
