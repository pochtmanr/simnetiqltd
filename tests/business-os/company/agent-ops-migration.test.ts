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
  "20261108130000_brain.sql",
  "20261108140000_bank.sql",
  "20261108150000_calendar.sql",
  "20261128120000_step_up.sql",
  "20261128130000_document_usage.sql",
  "20261128140000_agent_ops.sql",
].map(read);

const OWNER = "00000000-0000-4000-8000-000000000001";
const READER = "00000000-0000-4000-8000-000000000003";
const OUTSIDER = "00000000-0000-4000-8000-000000000004";

let shared: Promise<PGlite> | null = null;
function database(): Promise<PGlite> {
  shared ??= (async () => {
    const db = new PGlite();
    await db.exec(`
      create schema if not exists auth;
      create table if not exists auth.users (id uuid primary key, email text);
      create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      do $$ begin
        if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
        if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
        if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
      end $$;
      create schema if not exists storage;
      create table if not exists storage.buckets (id text primary key, name text not null, public boolean not null default false, file_size_limit bigint);
      create table if not exists storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text not null, name text);
    `);
    for (const sql of chain) await db.exec(sql);
    await db.exec(`
      insert into auth.users (id, email) values ('${OWNER}', 'o@example.test'), ('${READER}', 'r@example.test'), ('${OUTSIDER}', 'x@example.test');
      insert into business_os.memberships (organization_id, user_id, role) select id, '${OWNER}', 'owner' from business_os.organizations where slug = 'simnetiq';
      insert into business_os.memberships (organization_id, user_id, role) select id, '${READER}', 'read_only' from business_os.organizations where slug = 'simnetiq';
      with other as (insert into business_os.organizations (slug, legal_name, timezone) values ('other', 'Other Ltd', 'Europe/London') returning id)
      insert into business_os.memberships (organization_id, user_id, role) select id, '${OUTSIDER}', 'owner' from other;
    `);
    return db;
  })();
  return shared;
}

async function call<T>(db: PGlite, sql: string, params: unknown[] = []): Promise<T> {
  return Object.values((await db.query<Record<string, T>>(sql, params)).rows[0])[0];
}
const json = (value: unknown) => JSON.stringify(value);

test("tasks: create, partial update, complete, list and delete", async () => {
  const db = await database();
  const save = (actor: string, payload: unknown) => call<Record<string, unknown>>(db, `select business_os.save_task($1::uuid, $2::jsonb)`, [actor, json(payload)]);
  const created = await save(OWNER, { title: "  File the confirmation statement ", due_on: "2026-11-30", project_slug: "doppler", assignee: "agent" });
  assert.equal(created.title, "File the confirmation statement");
  assert.deepEqual([created.status, created.assignee, created.projectSlug, created.dueOn], ["open", "agent", "doppler", "2026-11-30"]);

  const done = await save(OWNER, { id: created.id, status: "done" });
  assert.equal(done.title, "File the confirmation statement");
  assert.equal(done.dueOn, "2026-11-30");
  assert.ok(done.completedAt);
  const reopened = await save(OWNER, { id: created.id, status: "doing", project_slug: "" });
  assert.deepEqual([reopened.completedAt, reopened.projectSlug], [null, null]);

  await save(OWNER, { title: "Later, no date" });
  const open = await call<{ title: string }[]>(db, `select business_os.list_tasks($1::uuid)`, [READER]);
  assert.deepEqual(open.map((task) => task.title), ["File the confirmation statement", "Later, no date"]);
  await save(OWNER, { id: created.id, status: "cancelled" });
  assert.equal((await call<unknown[]>(db, `select business_os.list_tasks($1::uuid)`, [OWNER])).length, 1);
  assert.equal((await call<unknown[]>(db, `select business_os.list_tasks($1::uuid, true)`, [OWNER])).length, 2);

  await assert.rejects(save(OWNER, { title: "" }), /task_title_invalid/);
  await assert.rejects(save(OWNER, { title: "x", status: "blocked" }), /task_status_invalid/);
  await assert.rejects(save(OWNER, { title: "x", project_slug: "nope" }), /task_project_invalid/);
  await assert.rejects(save(OWNER, { title: "x", due_on: "soon" }), /task_date_invalid/);
  await assert.rejects(save(READER, { title: "x" }), /reader_forbidden/);
  await assert.rejects(save(OUTSIDER, { id: created.id, title: "theirs" }), /task_missing/);
  assert.equal((await call<unknown[]>(db, `select business_os.list_tasks($1::uuid, true)`, [OUTSIDER])).length, 0);
  await assert.rejects(call(db, `select business_os.delete_task($1::uuid, $2::uuid)`, [OUTSIDER, created.id]), /task_missing/);
  await call(db, `select business_os.delete_task($1::uuid, $2::uuid)`, [OWNER, created.id]);
});

test("calendar accepts the release category and lists events in a range", async () => {
  const db = await database();
  const event = (category: string) => json({ title: "Ship 2.0", category, starts_on: "2026-12-10", ends_on: "2026-12-10" });
  await call(db, `select business_os.create_calendar_event($1::uuid, $2::jsonb)`, [OWNER, event("release")]);
  await assert.rejects(call(db, `select business_os.create_calendar_event($1::uuid, $2::jsonb)`, [OWNER, event("party")]), /calendar_category_invalid/);
  const inRange = await call<{ title: string; category: string }[]>(db, `select business_os.list_calendar_events($1::uuid, '2026-12-01', '2026-12-31')`, [READER]);
  assert.deepEqual(inRange.map((row) => [row.title, row.category]), [["Ship 2.0", "release"]]);
  assert.equal((await call<unknown[]>(db, `select business_os.list_calendar_events($1::uuid, '2027-01-01', '2027-01-31')`, [OWNER])).length, 0);
  assert.equal((await call<unknown[]>(db, `select business_os.list_calendar_events($1::uuid, '2026-12-01', '2026-12-31')`, [OUTSIDER])).length, 0);
});

test("company profile is seeded from the public record and edits change only what is sent", async () => {
  const db = await database();
  const seeded = await call<Record<string, unknown>>(db, `select business_os.company_profile($1::uuid)`, [READER]);
  assert.deepEqual(
    [seeded.legalName, seeded.companyNumber, seeded.incorporatedOn, seeded.yearEndMonth, seeded.yearEndDay, seeded.vatNumber],
    ["Simnetiq Ltd", "16861177", "2025-11-17", 11, 30, null],
  );
  const save = (actor: string, payload: unknown) => call<Record<string, unknown>>(db, `select business_os.save_company_profile($1::uuid, $2::jsonb)`, [actor, json(payload)]);
  const saved = await save(OWNER, { vat_number: "gb 123 4567 89", vat_stagger: "2", director_name: "A Director" });
  assert.deepEqual([saved.vatNumber, saved.vatStagger, saved.directorName, saved.companyNumber], ["GB123456789", 2, "A Director", "16861177"]);
  assert.equal((await save(OWNER, { vat_number: "" })).vatNumber, null);
  await assert.rejects(save(OWNER, { vat_stagger: "7" }), /company_profile_invalid/);
  await assert.rejects(save(OWNER, { year_end_month: "" }), /company_profile_invalid/);
  await assert.rejects(save(OWNER, { legal_name: "" }), /company_profile_invalid/);
  await assert.rejects(save(READER, { director_name: "x" }), /reader_forbidden/);
  await assert.rejects(save(OUTSIDER, { director_name: "x" }), /company_profile_missing/);
});

test("documents can be listed by folder and tag and read in full, inside the organization only", async () => {
  const db = await database();
  await db.exec(`
    insert into business_os.documents (organization_id, origin, title, folder, tags, upload_status, object_path, checksum_sha256, mime_type, byte_size, extracted_text, created_by)
    select id, 'central', 'Certificate', 'Company', array['req-incorporation-cert'], 'stored', 'org/cert', repeat('a', 64), 'application/pdf', 10, 'Certificate of incorporation text', '${OWNER}'
    from business_os.organizations where slug = 'simnetiq';
    insert into business_os.documents (organization_id, origin, title, folder, tags, upload_status, object_path, checksum_sha256, mime_type, byte_size, created_by)
    select id, 'central', 'Invoice', 'Finance', array[]::text[], 'stored', 'org/invoice', repeat('b', 64), 'application/pdf', 10, '${OWNER}' from business_os.organizations where slug = 'simnetiq';
  `);
  const list = (actor: string, folder: string | null, tags: string[] | null) =>
    call<{ id: string; title: string }[]>(db, `select business_os.list_documents($1::uuid, $2, $3::text[])`, [actor, folder, tags]);
  assert.equal((await list(READER, null, null)).length, 2);
  assert.deepEqual((await list(READER, "Company", null)).map((row) => row.title), ["Certificate"]);
  const tagged = await list(READER, null, ["req-incorporation-cert", "req-articles"]);
  assert.deepEqual(tagged.map((row) => row.title), ["Certificate"]);
  assert.equal((await list(OUTSIDER, null, null)).length, 0);
  const full = await call<{ extractedText: string }>(db, `select business_os.get_document($1::uuid, $2::uuid)`, [READER, tagged[0].id]);
  assert.match(full.extractedText, /incorporation text/);
  await assert.rejects(call(db, `select business_os.get_document($1::uuid, $2::uuid)`, [OUTSIDER, tagged[0].id]), /document_missing/);
});

test("agent activity is recorded per organization and readable only by its members", async () => {
  const db = await database();
  await db.query(`select business_os.record_agent_activity($1::uuid, 'write', 'tasks_save', 'title: File the statement', 'ok', null)`, [OWNER]);
  await assert.rejects(db.query(`select business_os.record_agent_activity($1::uuid, 'admin', 'x', null, 'ok', null)`, [OWNER]), /check constraint/);
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${OUTSIDER}';`);
  try {
    assert.equal((await db.query(`select id from business_os.agent_activity`)).rows.length, 0);
    assert.equal((await db.query(`select id from business_os.tasks`)).rows.length, 0);
    await assert.rejects(db.exec(`select business_os.save_task('${OUTSIDER}', '{"title":"x"}')`), /permission denied/);
    await db.exec(`set request.jwt.claim.sub = '${OWNER}';`);
    assert.equal((await db.query(`select id from business_os.agent_activity`)).rows.length, 1);
    await assert.rejects(db.exec(`insert into business_os.agent_activity (organization_id, actor_user_id, token_kind, tool, outcome) select id, '${OWNER}', 'read', 'x', 'ok' from business_os.organizations`), /permission denied/);
  } finally {
    await db.exec(`reset role; reset request.jwt.claim.sub;`);
  }
});
