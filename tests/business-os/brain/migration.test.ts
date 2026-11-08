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
].map(read);

const OWNER = "00000000-0000-4000-8000-000000000001";
const READER = "00000000-0000-4000-8000-000000000002";

async function setup(): Promise<PGlite> {
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
    insert into auth.users (id, email) values ('${OWNER}', 'o@example.test'), ('${READER}', 'r@example.test');
    insert into business_os.memberships (organization_id, user_id, role) select id, '${OWNER}', 'owner' from business_os.organizations;
    insert into business_os.memberships (organization_id, user_id, role) select id, '${READER}', 'read_only' from business_os.organizations;
  `);
  return db;
}

async function save(db: PGlite, payload: Record<string, unknown>, actor = OWNER): Promise<{ id: string; title: string }> {
  const result = await db.query<{ r: { id: string; title: string } }>(`select business_os.save_note($1, $2::jsonb) as r`, [actor, JSON.stringify(payload)]);
  return result.rows[0].r;
}

test("brain: save, link, backlink, search, rename-safe keys and delete", async () => {
  const db = await setup();
  const roadmap = await save(db, { title: "Roadmap", body_md: "Ship [[Pricing]] and [[Hiring]]. #plan", tags: ["plan"], links: ["Pricing", "Hiring", "pricing"] });
  const pricing = await save(db, { title: "Pricing", folder: "Strategy", body_md: "Tiers for the Doppler VPN app", tags: [], links: [] });

  const out = await db.query<{ to_key: string }>(`select to_key from business_os.note_links where from_note = $1 order by to_key`, [roadmap.id]);
  assert.deepEqual(out.rows.map((row) => row.to_key), ["hiring", "pricing"]);

  const back = await db.query<{ title: string }>(
    `select n.title from business_os.note_links l join business_os.notes n on n.id = l.from_note
     join business_os.notes t on t.link_key = l.to_key and t.organization_id = l.organization_id where t.id = $1`,
    [pricing.id],
  );
  assert.deepEqual(back.rows, [{ title: "Roadmap" }]);

  const hits = await db.query<{ id: string; snippet: string }>(`select id, snippet from business_os.search_notes($1, 'doppler', 10)`, [READER]);
  assert.equal(hits.rows[0]?.id, pricing.id);
  assert.match(hits.rows[0].snippet, /<<Doppler>>/);

  await assert.rejects(() => save(db, { title: "  pricing ", body_md: "", tags: [], links: [] }), /note_title_taken/);
  await assert.rejects(() => save(db, { title: "a/b", body_md: "", tags: [], links: [] }), /title_invalid/);
  await assert.rejects(() => save(db, { title: "x", body_md: "", tags: ["Bad Tag"], links: [] }), /tag_invalid/);
  await assert.rejects(() => save(db, { title: "x", body_md: "", tags: [], links: [] }, READER), /reader_forbidden/);

  const renamed = await save(db, { id: roadmap.id, title: "Roadmap 2027", body_md: "Ship [[Pricing]]", tags: [], links: ["Pricing"] });
  assert.equal(renamed.id, roadmap.id);
  const after = await db.query<{ to_key: string }>(`select to_key from business_os.note_links where from_note = $1`, [roadmap.id]);
  assert.deepEqual(after.rows, [{ to_key: "pricing" }]);

  await db.query(`select business_os.delete_note($1, $2)`, [OWNER, roadmap.id]);
  const left = await db.query(`select 1 from business_os.note_links where from_note = $1`, [roadmap.id]);
  assert.equal(left.rows.length, 0);
  await db.close();
});

test("brain: vault import upserts by title and counts created and updated", async () => {
  const db = await setup();
  await save(db, { title: "Existing", body_md: "old", tags: [], links: [] });
  const notes = [
    { title: "Existing", folder: "Imported", body_md: "new body [[Fresh]]", tags: ["x"], links: ["Fresh"] },
    { title: "Fresh", folder: "Imported/Sub", body_md: "---\ntags: [y]\n---\nhello", tags: ["y"], links: [] },
  ];
  const result = await db.query<{ r: { created: number; updated: number } }>(`select business_os.import_notes($1, $2::jsonb) as r`, [OWNER, JSON.stringify(notes)]);
  assert.deepEqual(result.rows[0].r, { created: 1, updated: 1 });
  const bodies = await db.query<{ title: string; body_md: string; folder: string }>(`select title, body_md, folder from business_os.notes order by title`);
  assert.deepEqual(bodies.rows, [
    { title: "Existing", body_md: "new body [[Fresh]]", folder: "Imported" },
    { title: "Fresh", body_md: "---\ntags: [y]\n---\nhello", folder: "Imported/Sub" },
  ]);
  await assert.rejects(() => db.query(`select business_os.import_notes($1, '[]'::jsonb)`, [OWNER]), /import_invalid/);
  await db.close();
});

test("brain: writes go through functions only; api roles cannot call them", async () => {
  const db = await setup();
  const grants = await db.query<{ name: string; anon: boolean; authenticated: boolean; service: boolean }>(`
    select p.proname as name,
      has_function_privilege('anon', p.oid, 'execute') as anon,
      has_function_privilege('authenticated', p.oid, 'execute') as authenticated,
      has_function_privilege('service_role', p.oid, 'execute') as service
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'business_os' and p.proname in ('save_note', 'import_notes', 'delete_note', 'search_notes')`);
  assert.equal(grants.rows.length, 4);
  for (const row of grants.rows) assert.deepEqual([row.anon, row.authenticated, row.service], [false, false, true], row.name);
  const table = await db.query<{ insert: boolean; select: boolean }>(
    `select has_table_privilege('authenticated', 'business_os.notes', 'insert') as insert, has_table_privilege('authenticated', 'business_os.notes', 'select') as select`,
  );
  assert.deepEqual(table.rows[0], { insert: false, select: true });
  await db.close();
});
