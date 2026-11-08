-- Brain: linked markdown notes.
-- A note is addressed by its title, as in Obsidian: [[Title]] links to the note whose
-- link_key (lower-cased, whitespace-collapsed title) matches. Bodies are stored verbatim
-- so an exported vault is byte-identical to what was imported or typed. Links and tags
-- are parsed by the server (lib/business-os/brain/wikilinks.ts) and passed in on save.

create function business_os.note_link_key(title text)
returns text
language sql
immutable
set search_path = ''
as $fn$
  select lower(regexp_replace(btrim(title), '\s+', ' ', 'g'))
$fn$;

-- array_to_string is only STABLE (element output functions could vary); for text[] it is deterministic.
create function business_os.tags_text(tags text[])
returns text
language sql
immutable
set search_path = ''
as $fn$
  select array_to_string(tags, ' ')
$fn$;

create table business_os.notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references business_os.organizations (id),
  title text not null check (char_length(btrim(title)) between 1 and 200 and title !~ '[\[\]|#^\\/:]'),
  link_key text generated always as (business_os.note_link_key(title)) stored,
  folder text not null default '' check (business_os.document_folder_valid(folder)),
  body_md text not null default '' check (char_length(body_md) <= 200000),
  tags text[] not null default '{}',
  project_id uuid references business_os.projects (id),
  document_id uuid references business_os.documents (id) on delete set null,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search tsvector generated always as (
    setweight(to_tsvector('simple', title), 'A')
    || setweight(to_tsvector('simple', business_os.tags_text(tags)), 'B')
    || setweight(to_tsvector('simple', left(body_md, 200000)), 'C')
  ) stored,
  check (cardinality(tags) <= 32),
  unique (organization_id, link_key)
);

create index notes_org_updated_idx on business_os.notes (organization_id, updated_at desc);
create index notes_search_idx on business_os.notes using gin (search);

create table business_os.note_links (
  organization_id uuid not null references business_os.organizations (id),
  from_note uuid not null references business_os.notes (id) on delete cascade,
  to_key text not null check (char_length(to_key) between 1 and 200),
  primary key (from_note, to_key)
);

create index note_links_target_idx on business_os.note_links (organization_id, to_key);

alter table business_os.notes enable row level security;
alter table business_os.notes force row level security;
alter table business_os.note_links enable row level security;
alter table business_os.note_links force row level security;

create policy notes_select on business_os.notes
for select to authenticated using (business_os.is_active_member(organization_id));
create policy note_links_select on business_os.note_links
for select to authenticated using (business_os.is_active_member(organization_id));

revoke all on business_os.notes, business_os.note_links from public, anon;
grant select on business_os.notes, business_os.note_links to authenticated;
revoke insert, update, delete, truncate on business_os.notes, business_os.note_links from authenticated;

create function business_os.assert_note_input(title text, folder text, body_md text, tags jsonb, links jsonb)
returns void
language plpgsql
immutable
set search_path = ''
as $fn$
declare
  item text;
begin
  if title is null or char_length(btrim(title)) not between 1 and 200 or title ~ '[\[\]|#^\\/:]' then
    raise exception 'title_invalid' using errcode = '22023';
  end if;
  if not business_os.document_folder_valid(coalesce(folder, '')) then
    raise exception 'folder_invalid' using errcode = '22023';
  end if;
  if body_md is null or char_length(body_md) > 200000 then
    raise exception 'note_too_large' using errcode = '22023';
  end if;
  if jsonb_typeof(coalesce(tags, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(tags, '[]'::jsonb)) > 32 then
    raise exception 'tag_invalid' using errcode = '22023';
  end if;
  for item in select jsonb_array_elements_text(coalesce(tags, '[]'::jsonb))
  loop
    if item !~ '^[a-z0-9][a-z0-9/_-]{0,63}$' then
      raise exception 'tag_invalid' using errcode = '22023';
    end if;
  end loop;
  if jsonb_typeof(coalesce(links, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(links, '[]'::jsonb)) > 500 then
    raise exception 'links_invalid' using errcode = '22023';
  end if;
  for item in select jsonb_array_elements_text(coalesce(links, '[]'::jsonb))
  loop
    if char_length(item) not between 1 and 200 then
      raise exception 'links_invalid' using errcode = '22023';
    end if;
  end loop;
end;
$fn$;

-- Create (no id) or update a note and replace its outgoing links.
create function business_os.save_note(actor_id uuid, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
  note_id uuid := nullif(payload ->> 'id', '')::uuid;
  v_project_id uuid;
  doc_id uuid := nullif(payload ->> 'document_id', '')::uuid;
  saved business_os.notes%rowtype;
begin
  org_id := business_os.assert_operations_writer(actor_id);
  perform business_os.assert_note_input(payload ->> 'title', payload ->> 'folder', payload ->> 'body_md', payload -> 'tags', payload -> 'links');
  if nullif(payload ->> 'project_slug', '') is not null then
    v_project_id := business_os.project_in_org(org_id, payload ->> 'project_slug');
    if v_project_id is null then
      raise exception 'project_missing' using errcode = '22023';
    end if;
  end if;
  if doc_id is not null and not exists (
    select 1 from business_os.documents d where d.id = doc_id and d.organization_id = org_id
  ) then
    raise exception 'document_missing' using errcode = '42501';
  end if;
  if exists (
    select 1 from business_os.notes n
    where n.organization_id = org_id
      and n.link_key = business_os.note_link_key(payload ->> 'title')
      and n.id is distinct from note_id
  ) then
    raise exception 'note_title_taken' using errcode = '23505';
  end if;

  if note_id is null then
    insert into business_os.notes (organization_id, title, folder, body_md, tags, project_id, document_id, created_by)
    values (
      org_id,
      btrim(payload ->> 'title'),
      coalesce(payload ->> 'folder', ''),
      payload ->> 'body_md',
      coalesce((select array_agg(value) from jsonb_array_elements_text(coalesce(payload -> 'tags', '[]'::jsonb)) as value), '{}'),
      v_project_id,
      doc_id,
      actor_id
    )
    returning * into saved;
  else
    update business_os.notes n
    set title = btrim(payload ->> 'title'),
        folder = coalesce(payload ->> 'folder', ''),
        body_md = payload ->> 'body_md',
        tags = coalesce((select array_agg(value) from jsonb_array_elements_text(coalesce(payload -> 'tags', '[]'::jsonb)) as value), '{}'),
        project_id = case when payload ? 'project_slug' then v_project_id else n.project_id end,
        document_id = case when payload ? 'document_id' then doc_id else n.document_id end,
        updated_at = now()
    where n.id = note_id
      and n.organization_id = org_id
    returning * into saved;
    if saved.id is null then
      raise exception 'note_missing' using errcode = '42501';
    end if;
  end if;

  delete from business_os.note_links l where l.from_note = saved.id;
  insert into business_os.note_links (organization_id, from_note, to_key)
  select distinct org_id, saved.id, business_os.note_link_key(value)
  from jsonb_array_elements_text(coalesce(payload -> 'links', '[]'::jsonb)) as value
  where business_os.note_link_key(value) <> '';

  return jsonb_build_object('id', saved.id, 'title', saved.title, 'updatedAt', saved.updated_at);
end;
$fn$;

-- Bulk upsert by title for vault import. Existing notes with the same title are overwritten.
create function business_os.import_notes(actor_id uuid, notes jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  org_id uuid;
  item jsonb;
  saved_id uuid;
  created integer := 0;
  updated integer := 0;
begin
  org_id := business_os.assert_operations_writer(actor_id);
  if jsonb_typeof(notes) <> 'array' or jsonb_array_length(notes) not between 1 and 200 then
    raise exception 'import_invalid' using errcode = '22023';
  end if;
  for item in select value from jsonb_array_elements(notes)
  loop
    perform business_os.assert_note_input(item ->> 'title', item ->> 'folder', item ->> 'body_md', item -> 'tags', item -> 'links');
    select n.id into saved_id
    from business_os.notes n
    where n.organization_id = org_id
      and n.link_key = business_os.note_link_key(item ->> 'title');
    if saved_id is null then
      insert into business_os.notes (organization_id, title, folder, body_md, tags, created_by)
      values (
        org_id,
        btrim(item ->> 'title'),
        coalesce(item ->> 'folder', ''),
        item ->> 'body_md',
        coalesce((select array_agg(value) from jsonb_array_elements_text(coalesce(item -> 'tags', '[]'::jsonb)) as value), '{}'),
        actor_id
      )
      returning id into saved_id;
      created := created + 1;
    else
      update business_os.notes n
      set folder = coalesce(item ->> 'folder', ''),
          body_md = item ->> 'body_md',
          tags = coalesce((select array_agg(value) from jsonb_array_elements_text(coalesce(item -> 'tags', '[]'::jsonb)) as value), '{}'),
          updated_at = now()
      where n.id = saved_id;
      updated := updated + 1;
    end if;
    delete from business_os.note_links l where l.from_note = saved_id;
    insert into business_os.note_links (organization_id, from_note, to_key)
    select distinct org_id, saved_id, business_os.note_link_key(value)
    from jsonb_array_elements_text(coalesce(item -> 'links', '[]'::jsonb)) as value
    where business_os.note_link_key(value) <> '';
  end loop;
  return jsonb_build_object('created', created, 'updated', updated);
end;
$fn$;

create function business_os.delete_note(actor_id uuid, note_id uuid)
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
  delete from business_os.notes n where n.id = note_id and n.organization_id = org_id;
  if not found then
    raise exception 'note_missing' using errcode = '42501';
  end if;
  return note_id;
end;
$fn$;

create function business_os.search_notes(actor_id uuid, search_text text, max_rows integer default 50)
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
      n.id,
      ts_rank(n.search, tsq),
      ts_headline('simple', left(n.body_md, 20000), tsq, 'MaxFragments=1, MaxWords=24, MinWords=8, StartSel=<<, StopSel=>>')
    from business_os.notes n
    where n.organization_id = org_id
      and n.search @@ tsq
    order by 2 desc, n.updated_at desc
    limit least(greatest(coalesce(max_rows, 50), 1), 100);
end;
$fn$;

revoke all on function business_os.note_link_key(text) from public, anon, authenticated;
revoke all on function business_os.tags_text(text[]) from public, anon, authenticated;
revoke all on function business_os.assert_note_input(text, text, text, jsonb, jsonb) from public, anon, authenticated;
revoke all on function business_os.save_note(uuid, jsonb) from public, anon, authenticated;
revoke all on function business_os.import_notes(uuid, jsonb) from public, anon, authenticated;
revoke all on function business_os.delete_note(uuid, uuid) from public, anon, authenticated;
revoke all on function business_os.search_notes(uuid, text, integer) from public, anon, authenticated;
grant execute on function business_os.save_note(uuid, jsonb) to service_role;
grant execute on function business_os.import_notes(uuid, jsonb) to service_role;
grant execute on function business_os.delete_note(uuid, uuid) to service_role;
grant execute on function business_os.search_notes(uuid, text, integer) to service_role;
