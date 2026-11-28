import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (name: string) => readFileSync(join(root, "supabase/business-os/migrations", name), "utf8");

const OWNER = "00000000-0000-4000-8000-000000000001";
const OTHER = "00000000-0000-4000-8000-000000000002";
const DEVICE = "a".repeat(64);
const OTHER_DEVICE = "b".repeat(64);
const BOT = "777";

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
  `);
  await db.exec(read("20260929120000_identity_foundation.sql"));
  await db.exec(read("20261128120000_step_up.sql"));
  await db.exec(`
    insert into auth.users (id, email) values ('${OWNER}', 'o@example.test'), ('${OTHER}', 'x@example.test');
    insert into business_os.memberships (organization_id, user_id, role) select id, '${OWNER}', 'owner' from business_os.organizations;
    insert into business_os.memberships (organization_id, user_id, role) select id, '${OTHER}', 'admin' from business_os.organizations;
    insert into business_os.telegram_identities (organization_id, user_id, bot_id, telegram_user_id)
      select id, '${OWNER}', '${BOT}', 1001 from business_os.organizations;
    insert into business_os.telegram_identities (organization_id, user_id, bot_id, telegram_user_id)
      select id, '${OTHER}', '${BOT}', 2002 from business_os.organizations;
  `);
  return db;
}

async function one<T>(db: PGlite, sql: string): Promise<T> {
  return Object.values((await db.query<Record<string, T>>(sql)).rows[0])[0];
}

const create = (db: PGlite, actor = OWNER, device = DEVICE) =>
  one<string>(db, `select business_os.create_step_up_request('${actor}', '${device}', 'Delete invoice.pdf')`);
const decide = (db: PGlite, id: string, actor = OWNER, telegram = 1001, approve = true) =>
  one<string>(db, `select business_os.decide_step_up_request('${actor}', '${id}', '${BOT}', ${telegram}, ${approve})`);
const claim = (db: PGlite, id: string, actor = OWNER, device = DEVICE) =>
  one<string>(db, `select business_os.claim_step_up_request('${actor}', '${id}', '${device}')`);

test("an approved request is claimed once, by the browser that asked", async () => {
  const db = await setup();
  const id = await create(db);
  assert.equal(await claim(db, id), "pending");
  assert.equal(await decide(db, id), "approved");
  assert.equal(await claim(db, id, OWNER, OTHER_DEVICE), "expired");
  assert.equal(await claim(db, id, OTHER), "expired");
  assert.equal(await claim(db, id), "approved");
  assert.equal(await claim(db, id), "expired");
  const events = await db.query<{ action: string; reason: string }>(`select action, reason from business_os.identity_events where action like 'step_up_%'`);
  assert.deepEqual(events.rows, [{ action: "step_up_approved", reason: "Delete invoice.pdf" }]);
});

test("only the member's own linked Telegram account can decide", async () => {
  const db = await setup();
  const id = await create(db);
  await assert.rejects(decide(db, id, OTHER, 2002), /step_up_request_invalid/);
  await assert.rejects(decide(db, id, OWNER, 2002), /step_up_request_invalid/);
  await assert.rejects(decide(db, id, OWNER, 9999), /step_up_request_invalid/);
  await db.exec(`update business_os.telegram_identities set revoked_at = now() where telegram_user_id = 1001`);
  await assert.rejects(decide(db, id), /step_up_request_invalid/);
  assert.equal(await claim(db, id), "pending");
});

test("a denied request never grants, and cannot be decided twice", async () => {
  const db = await setup();
  const id = await create(db);
  assert.equal(await decide(db, id, OWNER, 1001, false), "denied");
  assert.equal(await claim(db, id), "denied");
  await assert.rejects(decide(db, id), /step_up_request_invalid/);
});

test("an expired request can be neither approved nor claimed", async () => {
  const db = await setup();
  const id = await create(db);
  await db.exec(`update business_os.step_up_requests set expires_at = now() - interval '1 second'`);
  await assert.rejects(decide(db, id), /step_up_request_invalid/);
  assert.equal(await claim(db, id), "expired");

  const late = await create(db);
  await decide(db, late);
  await db.exec(`update business_os.step_up_requests set expires_at = now() - interval '1 second'`);
  assert.equal(await claim(db, late), "expired");
});

test("a new ask replaces the member's earlier one; non-members cannot ask", async () => {
  const db = await setup();
  const first = await create(db);
  const second = await create(db);
  assert.notEqual(first, second);
  await assert.rejects(decide(db, first), /step_up_request_invalid/);
  assert.equal(await decide(db, second), "approved");
  await assert.rejects(create(db, "00000000-0000-4000-8000-0000000000ff"), /membership_missing/);
});

test("members can read only their own requests, and nobody can write the table directly", async () => {
  const db = await setup();
  await create(db);
  await db.exec(`set role authenticated; set request.jwt.claim.sub = '${OTHER}';`);
  assert.equal((await db.query(`select id from business_os.step_up_requests`)).rows.length, 0);
  await assert.rejects(db.exec(`update business_os.step_up_requests set status = 'approved'`), /permission denied/);
  await assert.rejects(db.exec(`select business_os.claim_step_up_request('${OWNER}', gen_random_uuid(), '${DEVICE}')`), /permission denied/);
  await db.exec(`set request.jwt.claim.sub = '${OWNER}';`);
  assert.equal((await db.query(`select id from business_os.step_up_requests`)).rows.length, 1);
});
