-- Files: the Business OS data folder.
-- Adds folders, wider file types (text, csv, markdown, office), a 50 MB cap,
-- extracted text and a search vector. Uploads go browser -> Storage through a
-- signed upload URL; the server verifies the stored bytes before completing.

create function business_os.document_mime_allowed(mime text)
returns boolean
language sql
immutable
set search_path = ''
as $fn$
  select mime in (
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
$fn$;

create function business_os.document_folder_valid(folder text)
returns boolean
language sql
immutable
set search_path = ''
as $fn$
  select folder = ''
    or (
      char_length(folder) <= 200
      and folder ~ '^[A-Za-z0-9][A-Za-z0-9 _.-]{0,59}(/[A-Za-z0-9][A-Za-z0-9 _.-]{0,59}){0,5}$'
      and folder !~ '\.\.'
      and folder !~ ' /|/ | $'
    )
$fn$;

alter table business_os.documents drop constraint documents_byte_size_check;
alter table business_os.documents drop constraint documents_mime_type_check;

alter table business_os.documents
  add constraint documents_byte_size_check check (byte_size is null or (byte_size between 1 and 52428800)),
  add constraint documents_mime_type_check check (mime_type is null or business_os.document_mime_allowed(mime_type)),
  add column folder text not null default '' check (business_os.document_folder_valid(folder)),
  add column extracted_text text check (extracted_text is null or char_length(extracted_text) <= 500000),
  add column summary text check (summary is null or char_length(summary) <= 2000);

alter table business_os.documents
  add column search tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(vendor, '') || ' ' || coalesce(category, '') || ' ' || replace(folder, '/', ' ')), 'B')
    || setweight(to_tsvector('simple', coalesce(summary, '')), 'C')
    || setweight(to_tsvector('simple', left(coalesce(extracted_text, ''), 200000)), 'D')
  ) stored;

create index documents_search_idx on business_os.documents using gin (search);
create index documents_org_folder_idx on business_os.documents (organization_id, folder);

create or replace function business_os.register_upload(actor_id uuid, payload jsonb)
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
  folder text := coalesce(payload ->> 'folder', '');
begin
  org_id := business_os.assert_operations_writer(actor_id);
  if payload ->> 'title' is null or char_length(payload ->> 'title') not between 1 and 160 then
    raise exception 'title_invalid' using errcode = '22023';
  end if;
  if payload ? 'mime_type' and not business_os.document_mime_allowed(payload ->> 'mime_type') then
    raise exception 'mime_invalid' using errcode = '22023';
  end if;
  if payload ? 'byte_size' and (payload ->> 'byte_size')::bigint > 52428800 then
    raise exception 'document_too_large' using errcode = '22023';
  end if;
  if not business_os.document_folder_valid(folder) then
    raise exception 'folder_invalid' using errcode = '22023';
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
    object_path, upload_status, created_by, folder
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
    actor_id,
    folder
  );
  return jsonb_build_object('id', doc_id, 'objectPath', object_path);
end;
$fn$;

create or replace function business_os.complete_upload(
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
  if not business_os.document_mime_allowed(mime_type) then
    raise exception 'mime_invalid' using errcode = '22023';
  end if;
  if byte_size is null or byte_size < 1 or byte_size > 52428800 then
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

-- Edit a central document's metadata. Absent keys keep their value; empty strings clear optional fields.
create function business_os.update_document(actor_id uuid, document_id uuid, payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  org_id uuid;
  doc business_os.documents%rowtype;
  tag text;
  project_id uuid;
begin
  org_id := business_os.assert_operations_writer(actor_id);
  select * into doc
  from business_os.documents d
  where d.id = document_id
    and d.organization_id = org_id
  for update;
  if doc.id is null then
    raise exception 'document_missing' using errcode = '42501';
  end if;
  if doc.origin <> 'central' then
    raise exception 'source_read_only' using errcode = '22023';
  end if;
  if payload ? 'title' and (payload ->> 'title' is null or char_length(payload ->> 'title') not between 1 and 160) then
    raise exception 'title_invalid' using errcode = '22023';
  end if;
  if payload ? 'folder' and not business_os.document_folder_valid(coalesce(payload ->> 'folder', '')) then
    raise exception 'folder_invalid' using errcode = '22023';
  end if;
  if payload ? 'tags' then
    if jsonb_typeof(payload -> 'tags') <> 'array' or jsonb_array_length(payload -> 'tags') > 12 then
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
  update business_os.documents d
  set title = case when payload ? 'title' then payload ->> 'title' else d.title end,
      folder = case when payload ? 'folder' then coalesce(payload ->> 'folder', '') else d.folder end,
      category = case when payload ? 'category' then nullif(payload ->> 'category', '') else d.category end,
      vendor = case when payload ? 'vendor' then nullif(payload ->> 'vendor', '') else d.vendor end,
      tags = case
        when payload ? 'tags' then coalesce(
          (select array_agg(value) from jsonb_array_elements_text(payload -> 'tags') as value),
          '{}'
        )
        else d.tags
      end,
      project_id = case when payload ? 'project_slug' then project_id else d.project_id end,
      document_on = case
        when payload ? 'document_on' then business_os.parse_date(nullif(payload ->> 'document_on', ''))
        else d.document_on
      end,
      updated_at = now()
  where d.id = doc.id;
  return doc.id;
end;
$fn$;

-- Store text the server extracted from verified bytes. Server-only: the route computes it.
create function business_os.store_document_text(actor_id uuid, document_id uuid, extracted_text text, summary text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_variable
declare
  org_id uuid;
begin
  org_id := business_os.assert_operations_writer(actor_id);
  update business_os.documents d
  set extracted_text = left(store_document_text.extracted_text, 500000),
      summary = left(store_document_text.summary, 2000),
      updated_at = now()
  where d.id = document_id
    and d.organization_id = org_id
    and d.origin = 'central'
    and d.upload_status = 'stored';
  if not found then
    raise exception 'document_missing' using errcode = '42501';
  end if;
  return document_id;
end;
$fn$;

-- Delete an unlinked central document and return its object path so the caller can remove the bytes.
create function business_os.delete_document(actor_id uuid, document_id uuid)
returns jsonb
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
  select * into doc
  from business_os.documents d
  where d.id = document_id
    and d.organization_id = org_id
  for update;
  if doc.id is null then
    raise exception 'document_missing' using errcode = '42501';
  end if;
  if doc.origin <> 'central' then
    raise exception 'source_read_only' using errcode = '22023';
  end if;
  if exists (select 1 from business_os.document_links l where l.document_id = doc.id) then
    raise exception 'document_linked' using errcode = '22023';
  end if;
  delete from business_os.documents d where d.id = doc.id;
  return jsonb_build_object('objectPath', doc.object_path);
end;
$fn$;

-- Ranked full-text search over the organization's documents.
create function business_os.search_documents(actor_id uuid, search_text text, max_rows integer default 50)
returns table (id uuid, rank real, snippet text)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
#variable_conflict use_column
declare
  org_id uuid;
  tsq tsquery;
begin
  org_id := business_os.assert_operations_reader(actor_id);
  if search_text is null or char_length(btrim(search_text)) not between 1 and 200 then
    raise exception 'query_invalid' using errcode = '22023';
  end if;
  tsq := websearch_to_tsquery('simple', search_text);
  return query
    select
      d.id,
      ts_rank(d.search, tsq) as rank,
      ts_headline(
        'simple',
        coalesce(d.summary, '') || ' ' || left(coalesce(d.extracted_text, ''), 20000),
        tsq,
        'MaxFragments=1, MaxWords=24, MinWords=8, StartSel=<<, StopSel=>>'
      ) as snippet
    from business_os.documents d
    where d.organization_id = org_id
      and d.search @@ tsq
    order by 2 desc, d.created_at desc
    limit least(greatest(coalesce(max_rows, 50), 1), 100);
end;
$fn$;

revoke all on function business_os.document_mime_allowed(text) from public, anon, authenticated;
revoke all on function business_os.document_folder_valid(text) from public, anon, authenticated;
revoke all on function business_os.update_document(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function business_os.store_document_text(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function business_os.delete_document(uuid, uuid) from public, anon, authenticated;
revoke all on function business_os.search_documents(uuid, text, integer) from public, anon, authenticated;
grant execute on function business_os.update_document(uuid, uuid, jsonb) to service_role;
grant execute on function business_os.store_document_text(uuid, uuid, text, text) to service_role;
grant execute on function business_os.delete_document(uuid, uuid) to service_role;
grant execute on function business_os.search_documents(uuid, text, integer) to service_role;

do $bucket$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'storage' and table_name = 'buckets' and column_name = 'file_size_limit'
  ) then
    update storage.buckets set file_size_limit = 52428800 where id = 'business-os-documents';
  end if;
end
$bucket$;
