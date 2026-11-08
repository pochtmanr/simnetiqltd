import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (name: string) => readFileSync(join(root, "supabase/business-os/migrations", name), "utf8");

const chain = [
  "20260929120000_identity_foundation.sql",
  "20260929150000_finance_core.sql",
  "20260929180000_project_pulls.sql",
  "20260929210000_reconciliation.sql",
  "20260929240000_documents_registry.sql",
  "20261108120000_files_folders.sql",
].map(read);

const preamble = `
  create schema if not exists auth;
  create table if not exists auth.users (id uuid primary key, email text);
  create or replace function auth.uid() returns uuid
  language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
    if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
  end $$;
  create schema if not exists storage;
  create table if not exists storage.buckets (id text primary key, name text not null, public boolean not null default false, file_size_limit bigint);
  create table if not exists storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text not null, name text);
`;

const OWNER = "00000000-0000-4000-8000-000000000001";
const READER = "00000000-0000-4000-8000-000000000002";

async function setup(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(preamble);
  for (const sql of chain) await db.exec(sql);
  await db.exec(`
    insert into auth.users (id, email) values ('${OWNER}', 'owner@example.test'), ('${READER}', 'reader@example.test');
    insert into business_os.memberships (organization_id, user_id, role)
    select id, '${OWNER}', 'owner' from business_os.organizations;
    insert into business_os.memberships (organization_id, user_id, role)
    select id, '${READER}', 'read_only' from business_os.organizations;
  `);
  return db;
}

async function register(db: PGlite, payload: Record<string, unknown>): Promise<{ id: string; objectPath: string }> {
  const result = await db.query<{ r: { id: string; objectPath: string } }>(`select business_os.register_upload($1, $2::jsonb) as r`, [OWNER, JSON.stringify(payload)]);
  return result.rows[0].r;
}

const SHA = "a".repeat(64);

test("files migration: folders, wider types, 50 MB cap, edit, search and delete", async () => {
  const db = await setup();

  const bucket = await db.query<{ limit: number | null }>(`select file_size_limit::int as limit from storage.buckets where id = 'business-os-documents'`);
  assert.equal(bucket.rows[0].limit, 52428800);

  const doc = await register(db, { title: "Hetzner invoice", folder: "Finance/2026", mime_type: "text/markdown", byte_size: 30 * 1024 * 1024, tags: ["hosting"] });
  await db.query(`select business_os.complete_upload($1, $2, $3, 'text/markdown', 31457280)`, [OWNER, doc.id, SHA]);
  await db.query(`select business_os.store_document_text($1, $2, 'Server rental for the Doppler VPN cluster in Falkenstein', null)`, [OWNER, doc.id]);

  const row = await db.query<{ folder: string; upload_status: string; byte_size: number }>(`select folder, upload_status, byte_size from business_os.documents where id = $1`, [doc.id]);
  assert.deepEqual(row.rows[0], { folder: "Finance/2026", upload_status: "stored", byte_size: 31457280 });

  const hits = await db.query<{ id: string; snippet: string }>(`select id, snippet from business_os.search_documents($1, 'falkenstein', 10)`, [READER]);
  assert.equal(hits.rows.length, 1);
  assert.equal(hits.rows[0].id, doc.id);
  assert.match(hits.rows[0].snippet, /<<Falkenstein>>/);
  const byFolder = await db.query(`select id from business_os.search_documents($1, 'finance', 10)`, [OWNER]);
  assert.equal(byFolder.rows.length, 1);

  await db.query(`select business_os.update_document($1, $2, $3::jsonb)`, [OWNER, doc.id, JSON.stringify({ folder: "Archive", title: "Hetzner March", vendor: "" })]);
  const edited = await db.query<{ folder: string; title: string; vendor: string | null; tags: string[] }>(`select folder, title, vendor, tags from business_os.documents where id = $1`, [doc.id]);
  assert.deepEqual(edited.rows[0], { folder: "Archive", title: "Hetzner March", vendor: null, tags: ["hosting"] });

  await assert.rejects(() => db.query(`select business_os.update_document($1, $2, '{"folder":"../x"}'::jsonb)`, [OWNER, doc.id]), /folder_invalid/);
  await assert.rejects(() => db.query(`select business_os.update_document($1, $2, '{"title":"x"}'::jsonb)`, [READER, doc.id]), /reader_forbidden/);
  await assert.rejects(() => register(db, { title: "x", mime_type: "application/x-msdownload" }), /mime_invalid/);
  await assert.rejects(() => register(db, { title: "x", byte_size: 52428801 }), /document_too_large/);
  await assert.rejects(() => register(db, { title: "x", folder: "a//b" }), /folder_invalid/);

  const deleted = await db.query<{ r: { objectPath: string } }>(`select business_os.delete_document($1, $2) as r`, [OWNER, doc.id]);
  assert.equal(deleted.rows[0].r.objectPath, doc.objectPath);
  const gone = await db.query(`select 1 from business_os.documents where id = $1`, [doc.id]);
  assert.equal(gone.rows.length, 0);
  await db.close();
});

test("files migration: a linked document cannot be deleted", async () => {
  const db = await setup();
  const doc = await register(db, { title: "Receipt", mime_type: "application/pdf", byte_size: 10 });
  await db.query(`select business_os.complete_upload($1, $2, $3, 'application/pdf', 10)`, [OWNER, doc.id, SHA]);
  await db.exec(`
    insert into business_os.timeline_events (organization_id, title, occurs_on)
    select id, 'Filing', date '2026-12-01' from business_os.organizations;
    insert into business_os.document_links (organization_id, document_id, target_kind, timeline_event_id)
    select e.organization_id, '${doc.id}', 'timeline_event', e.id from business_os.timeline_events e;
  `);
  await assert.rejects(() => db.query(`select business_os.delete_document($1, $2)`, [OWNER, doc.id]), /document_linked/);
  await db.close();
});

test("files migration: new functions are not callable by api roles", async () => {
  const db = await setup();
  const grants = await db.query<{ name: string; anon: boolean; authenticated: boolean; service: boolean }>(`
    select p.proname as name,
      has_function_privilege('anon', p.oid, 'execute') as anon,
      has_function_privilege('authenticated', p.oid, 'execute') as authenticated,
      has_function_privilege('service_role', p.oid, 'execute') as service
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'business_os' and p.proname in ('update_document', 'store_document_text', 'delete_document', 'search_documents')
  `);
  assert.equal(grants.rows.length, 4);
  for (const row of grants.rows) assert.deepEqual([row.name, row.anon, row.authenticated, row.service], [row.name, false, false, true]);
  await db.close();
});
