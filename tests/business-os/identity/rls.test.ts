import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const migration = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../../supabase/business-os/migrations/20260929120000_identity_foundation.sql"),
  "utf8",
);

const ownerId = "11111111-1111-4111-8111-111111111111";
const readerId = "22222222-2222-4222-8222-222222222222";

const preamble = `
  create schema if not exists auth;
  create table if not exists auth.users (
    id uuid primary key,
    email text
  );
  create or replace function auth.uid() returns uuid
  language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  create schema if not exists storage;
  create table if not exists storage.buckets (
    id text primary key,
    name text not null,
    public boolean not null default false
  );
  create table if not exists storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text not null,
    name text
  );
`;

async function queryAs(db: PGlite, role: string, sub: string | null, sql: string, params: unknown[] = []) {
  if (!["anon", "authenticated", "service_role"].includes(role)) throw new Error("unexpected role");
  await db.exec("begin");
  try {
    if (sub) {
      await db.query(`select set_config('request.jwt.claim.sub', $1, true)`, [sub]);
      await db.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub, aal: "aal2", role })]);
    }
    await db.exec(`set local role ${role}`);
    const result = await db.query(sql, params);
    await db.exec("commit");
    return result.rows;
  } catch (error) {
    await db.exec("rollback");
    throw error;
  }
}

test("identity policies deny anonymous and read-only writes, and replay initData", async () => {
  const db = new PGlite();
  await db.exec(preamble);
  await db.exec(migration);
  await db.exec(`
    insert into auth.users (id, email) values
      ('${ownerId}', 'owner@example.test'),
      ('${readerId}', 'reader@example.test');
    select business_os.grant_owner('${ownerId}'::uuid);
    insert into business_os.memberships (organization_id, user_id, role)
    select id, '${readerId}'::uuid, 'read_only'
    from business_os.organizations where slug = 'simnetiq';
    grant insert, select on storage.objects to anon, authenticated;
    grant usage on schema storage to anon, authenticated;
  `);

  const projects = await db.query<{ slug: string; state: string; reporting_enabled: boolean }>(
    `select slug, state, reporting_enabled from business_os.projects order by slug`,
  );
  assert.deepEqual(
    projects.rows.map((row) => [row.slug, row.state, row.reporting_enabled]),
    [
      ["doppler", "unverified", false],
      ["smscode", "unverified", false],
    ],
  );

  const privileges = await db.query<{ name: string; allowed: boolean }>(`
    select 'authenticated' as name, has_function_privilege('authenticated', 'business_os.consume_init_data(uuid,text,text)', 'execute') as allowed
    union all
    select 'anon', has_function_privilege('anon', 'business_os.upsert_integration_config(uuid,uuid,text,text,text)', 'execute')
    union all
    select 'service', has_function_privilege('service_role', 'business_os.consume_init_data(uuid,text,text)', 'execute')
  `);
  const allowed = Object.fromEntries(privileges.rows.map((row) => [row.name, row.allowed]));
  assert.equal(allowed.authenticated, false);
  assert.equal(allowed.anon, false);
  assert.equal(allowed.service, true);

  await assert.rejects(() => queryAs(db, "anon", null, `select * from business_os.organizations`));
  await assert.rejects(() =>
    queryAs(db, "authenticated", ownerId, `select business_os.consume_init_data($1::uuid, 'hash', 'session')`, [ownerId]),
  );

  const visible = await queryAs(db, "authenticated", ownerId, `select slug from business_os.organizations`);
  assert.deepEqual(visible, [{ slug: "simnetiq" }]);

  const project = await db.query<{ id: string }>(`select id from business_os.projects where slug = 'doppler'`);
  const projectId = project.rows[0].id;
  await assert.rejects(() =>
    queryAs(
      db,
      "authenticated",
      readerId,
      `insert into business_os.integration_configs (organization_id, project_id, provider, environment, secret_reference)
       select organization_id, $1, 'export', 'staging', 'DOPPLER_EXPORT_KEY' from business_os.projects where id = $1`,
      [projectId],
    ),
  );
  await assert.rejects(() =>
    queryAs(
      db,
      "service_role",
      null,
      `select business_os.upsert_integration_config($1::uuid, $2::uuid, 'export', 'staging', 'raw-secret')`,
      [readerId, projectId],
    ),
  );
  await assert.rejects(() =>
    queryAs(
      db,
      "service_role",
      null,
      `select business_os.upsert_integration_config($1::uuid, $2::uuid, 'export', 'staging', 'not-a-name')`,
      [ownerId, projectId],
    ),
  );
  const saved = await queryAs(
    db,
    "service_role",
    null,
    `select business_os.upsert_integration_config($1::uuid, $2::uuid, 'export', 'staging', 'DOPPLER_EXPORT_KEY') as id`,
    [ownerId, projectId],
  );
  assert.equal(typeof (saved[0] as { id: string }).id, "string");

  const readerRows = await queryAs(db, "authenticated", readerId, `select slug from business_os.organizations`);
  assert.deepEqual(readerRows, [{ slug: "simnetiq" }]);
  const readerMembership = await db.query<{ id: string }>(
    `select id from business_os.memberships where user_id = '${readerId}'`,
  );
  await queryAs(
    db,
    "service_role",
    null,
    `select business_os.revoke_membership($1::uuid, $2::uuid, 'left the company')`,
    [ownerId, readerMembership.rows[0].id],
  );
  const afterRevoke = await queryAs(db, "authenticated", readerId, `select slug from business_os.organizations`);
  assert.deepEqual(afterRevoke, []);
  const ownerMembership = await db.query<{ id: string }>(
    `select id from business_os.memberships where user_id = '${ownerId}'`,
  );
  await assert.rejects(() =>
    queryAs(db, "service_role", null, `select business_os.revoke_membership($1::uuid, $2::uuid, 'remove owner')`, [
      ownerId,
      ownerMembership.rows[0].id,
    ]),
  );

  await queryAs(db, "service_role", null, `select business_os.consume_init_data($1::uuid, 'hash-1', 'session-a')`, [ownerId]);
  await queryAs(db, "service_role", null, `select business_os.consume_init_data($1::uuid, 'hash-1', 'session-a')`, [ownerId]);
  await assert.rejects(() =>
    queryAs(db, "service_role", null, `select business_os.consume_init_data($1::uuid, 'hash-1', 'session-b')`, [ownerId]),
  );

  await assert.rejects(() =>
    queryAs(db, "authenticated", ownerId, `insert into storage.objects (bucket_id, name) values ('business-os-private', 'secret.pdf')`),
  );
  await db.close();
});

test("the migration refuses a database that already has marketing contacts", async () => {
  const db = new PGlite();
  await db.exec(`${preamble} create table public.marketing_contacts (id int);`);
  await assert.rejects(() => db.exec(migration), /marketing_contacts/);
  await db.close();
});
