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
].map(read);

const OWNER = "00000000-0000-4000-8000-000000000001";
const ADMIN = "00000000-0000-4000-8000-000000000002";
const READER = "00000000-0000-4000-8000-000000000003";
const OUTSIDER = "00000000-0000-4000-8000-000000000004";
const MISSING = "00000000-0000-4000-8000-0000000000ff";

async function setup(): Promise<{ db: PGlite; org: string }> {
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
    insert into auth.users (id, email) values ('${OWNER}', 'o@example.test'), ('${ADMIN}', 'a@example.test'),
      ('${READER}', 'r@example.test'), ('${OUTSIDER}', 'x@example.test');
    insert into business_os.memberships (organization_id, user_id, role) select id, '${OWNER}', 'owner' from business_os.organizations;
    insert into business_os.memberships (organization_id, user_id, role) select id, '${ADMIN}', 'admin' from business_os.organizations;
    insert into business_os.memberships (organization_id, user_id, role) select id, '${READER}', 'read_only' from business_os.organizations;
    with other as (
      insert into business_os.organizations (slug, legal_name, timezone) values ('other', 'Other Ltd', 'Europe/London') returning id
    )
    insert into business_os.memberships (organization_id, user_id, role) select id, '${OUTSIDER}', 'owner' from other;
  `);
  const org = (await db.query<{ id: string }>(`select id from business_os.organizations where slug = 'simnetiq'`)).rows[0].id;
  return { db, org };
}

function event(extra: Record<string, unknown> = {}) {
  return {
    title: "  Google Ads push  ",
    notes: null,
    category: "advertising",
    starts_on: "2026-11-10",
    ends_on: "2026-11-12",
    start_time: null,
    end_time: null,
    amount: "250.00",
    currency: "GBP",
    recurrence: null,
    status: "planned",
    project_slug: "doppler",
    link_kind: null,
    link_id: null,
    ...extra,
  };
}

async function call(db: PGlite, fn: string, actor: string, payload: unknown): Promise<{ id: string }> {
  const result = await db.query<{ r: { id: string } }>(`select business_os.${fn}($1, $2::jsonb) as r`, [actor, JSON.stringify(payload)]);
  return result.rows[0].r;
}

async function selectAs(db: PGlite, sub: string, sql: string) {
  await db.exec("begin");
  try {
    await db.query(`select set_config('request.jwt.claim.sub', $1, true)`, [sub]);
    await db.exec("set local role authenticated");
    const result = await db.query(sql);
    await db.exec("commit");
    return result.rows;
  } catch (error) {
    await db.exec("rollback");
    throw error;
  }
}

test("calendar: owner and admin create, update and delete; the reader cannot write", async () => {
  const { db } = await setup();
  const created = await call(db, "create_calendar_event", OWNER, event());
  assert.match(created.id, /^[0-9a-f-]{36}$/);
  const row = await db.query<Record<string, unknown>>(
    `select e.title, e.amount::text as amount, e.currency, e.status, p.slug, e.created_by
     from business_os.calendar_events e left join business_os.projects p on p.id = e.project_id where e.id = $1`,
    [created.id],
  );
  assert.deepEqual(row.rows[0], { title: "Google Ads push", amount: "250.00", currency: "GBP", status: "planned", slug: "doppler", created_by: OWNER });

  const updated = await call(db, "update_calendar_event", ADMIN, {
    ...event({ title: "Weekly sync", category: "meeting", amount: null, currency: null, project_slug: null }),
    id: created.id,
    starts_on: "2026-11-11",
    ends_on: "2026-11-11",
    start_time: "09:30",
    end_time: "10:00",
    recurrence: { freq: "weekly", interval: 1, until: "2027-01-31" },
    status: "done",
  });
  assert.equal(updated.id, created.id);
  const after = await db.query<Record<string, unknown>>(
    `select title, category, amount, currency, project_id, start_time::text as start_time, end_time::text as end_time, recurrence, status
     from business_os.calendar_events where id = $1`,
    [created.id],
  );
  assert.deepEqual(after.rows[0], {
    title: "Weekly sync",
    category: "meeting",
    amount: null,
    currency: null,
    project_id: null,
    start_time: "09:30:00",
    end_time: "10:00:00",
    recurrence: { freq: "weekly", interval: 1, until: "2027-01-31" },
    status: "done",
  });

  await assert.rejects(() => call(db, "create_calendar_event", READER, event()), /reader_forbidden/);
  await assert.rejects(() => call(db, "update_calendar_event", READER, { ...event(), id: created.id }), /reader_forbidden/);
  await assert.rejects(() => call(db, "delete_calendar_event", READER, { id: created.id }), /reader_forbidden/);

  assert.deepEqual(await call(db, "delete_calendar_event", ADMIN, { id: created.id }), { id: created.id });
  assert.equal((await db.query(`select 1 from business_os.calendar_events`)).rows.length, 0);
  await db.close();
});

test("calendar: each rule raises its own code", async () => {
  const { db } = await setup();
  const cases: [Record<string, unknown>, RegExp][] = [
    [{ title: "   " }, /calendar_title_invalid/],
    [{ title: "x".repeat(201) }, /calendar_title_invalid/],
    [{ notes: "x".repeat(5001) }, /calendar_notes_invalid/],
    [{ category: "party" }, /calendar_category_invalid/],
    [{ ends_on: "2026-11-09" }, /calendar_dates_invalid/],
    [{ ends_on: "2027-11-12" }, /calendar_dates_invalid/],
    [{ starts_on: "2026-02-30" }, /calendar_dates_invalid/],
    [{ starts_on: null }, /calendar_dates_invalid/],
    [{ start_time: "25:00" }, /calendar_time_invalid/],
    [{ end_time: "10:00" }, /calendar_time_invalid/],
    [{ ends_on: "2026-11-10", start_time: "10:00", end_time: "09:00" }, /calendar_time_invalid/],
    [{ currency: null }, /calendar_money_invalid/],
    [{ amount: null }, /calendar_money_invalid/],
    [{ amount: "0" }, /calendar_money_invalid/],
    [{ amount: 250 }, /calendar_money_invalid/],
    [{ amount: "1.234" }, /calendar_money_invalid/],
    [{ currency: "gbp" }, /calendar_money_invalid/],
    [{ recurrence: { freq: "daily", interval: 1, until: null } }, /calendar_recurrence_invalid/],
    [{ recurrence: { freq: "weekly", interval: 0, until: null } }, /calendar_recurrence_invalid/],
    [{ recurrence: { freq: "weekly", interval: 53, until: null } }, /calendar_recurrence_invalid/],
    [{ recurrence: { freq: "weekly", interval: "2", until: null } }, /calendar_recurrence_invalid/],
    [{ recurrence: { freq: "monthly", interval: 1, until: "2026-01-01" } }, /calendar_recurrence_invalid/],
    [{ recurrence: { freq: "monthly", interval: 1, until: "soon" } }, /calendar_recurrence_invalid/],
    [{ recurrence: "weekly" }, /calendar_recurrence_invalid/],
    [{ status: "overdue" }, /calendar_status_invalid/],
    [{ project_slug: "nope" }, /project_missing/],
    [{ link_kind: "note" }, /calendar_link_invalid/],
    [{ link_kind: "invoice", link_id: MISSING }, /calendar_link_invalid/],
    [{ link_kind: "note", link_id: MISSING }, /calendar_link_invalid/],
  ];
  for (const [extra, code] of cases) {
    await assert.rejects(() => call(db, "create_calendar_event", OWNER, event(extra)), code, JSON.stringify(extra));
  }
  // Open-ended repeats, all-day multi-day spans and an end time on a later day are fine.
  await call(db, "create_calendar_event", OWNER, event({ recurrence: { freq: "yearly", interval: 1, until: null } }));
  await call(db, "create_calendar_event", OWNER, event({ ends_on: "2027-11-11" }));
  await call(db, "create_calendar_event", OWNER, event({ start_time: "18:00", end_time: "09:00" }));
  // The slug picks that project, not just any project in the org.
  const sms = await call(db, "create_calendar_event", OWNER, event({ project_slug: "smscode" }));
  const slug = await db.query<{ slug: string }>(
    `select p.slug from business_os.calendar_events e join business_os.projects p on p.id = e.project_id where e.id = $1`,
    [sms.id],
  );
  assert.equal(slug.rows[0].slug, "smscode");
  await db.close();
});

test("calendar: the table checks hold even without the function", async () => {
  const { db, org } = await setup();
  const insert = (columns: Record<string, string>) => {
    const row: Record<string, string> = { title: "'T'", category: "'bill'", starts_on: "'2026-11-10'", ends_on: "'2026-11-10'", ...columns };
    return db.query(
      `insert into business_os.calendar_events (organization_id, ${Object.keys(row).join(", ")}) values ($1, ${Object.values(row).join(", ")})`,
      [org],
    );
  };
  await insert({});
  for (const bad of [
    { amount: "10" },
    { currency: "'GBP'" },
    { amount: "0", currency: "'GBP'" },
    { category: "'party'" },
    { status: "'overdue'" },
    { title: "' padded '" },
    { ends_on: "'2026-11-09'" },
    { ends_on: "'2027-11-12'" },
    { end_time: "'10:00'" },
    { start_time: "'10:00'", end_time: "'09:00'" },
    { link_kind: "'note'" },
  ]) {
    await assert.rejects(() => insert(bad), /check/, JSON.stringify(bad));
  }
  await db.close();
});

test("calendar: another org's event or a missing id is not found", async () => {
  const { db } = await setup();
  const theirs = await call(db, "create_calendar_event", OUTSIDER, event({ project_slug: null }));
  const ours = await call(db, "create_calendar_event", OWNER, event());
  for (const id of [theirs.id, MISSING]) {
    await assert.rejects(() => call(db, "update_calendar_event", OWNER, { ...event(), id }), /calendar_event_not_found/);
    await assert.rejects(() => call(db, "delete_calendar_event", OWNER, { id }), /calendar_event_not_found/);
  }
  await assert.rejects(() => call(db, "update_calendar_event", OWNER, event()), /calendar_event_not_found/);
  await assert.rejects(() => call(db, "delete_calendar_event", OWNER, { id: "nope" }), /calendar_event_not_found/);
  // The outsider cannot touch ours either, and a project slug resolves only inside the actor's org.
  await assert.rejects(() => call(db, "delete_calendar_event", OUTSIDER, { id: ours.id }), /calendar_event_not_found/);
  await assert.rejects(() => call(db, "create_calendar_event", OUTSIDER, event()), /project_missing/);
  const count = await db.query<{ n: number }>(`select count(*)::int as n from business_os.calendar_events`);
  assert.equal(count.rows[0].n, 2);
  await db.close();
});

test("calendar: members read their org's events through RLS; api roles cannot write", async () => {
  const { db } = await setup();
  await call(db, "create_calendar_event", OWNER, event());
  await call(db, "create_calendar_event", OUTSIDER, event({ project_slug: null, title: "Theirs" }));
  assert.deepEqual(await selectAs(db, READER, `select title from business_os.calendar_events`), [{ title: "Google Ads push" }]);
  assert.deepEqual(await selectAs(db, OUTSIDER, `select title from business_os.calendar_events`), [{ title: "Theirs" }]);

  const grants = await db.query<{ name: string; anon: boolean; authenticated: boolean; service: boolean }>(`
    select p.proname as name,
      has_function_privilege('anon', p.oid, 'execute') as anon,
      has_function_privilege('authenticated', p.oid, 'execute') as authenticated,
      has_function_privilege('service_role', p.oid, 'execute') as service
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'business_os' and p.proname in ('create_calendar_event', 'update_calendar_event', 'delete_calendar_event')`);
  assert.equal(grants.rows.length, 3);
  for (const row of grants.rows) assert.deepEqual([row.anon, row.authenticated, row.service], [false, false, true], row.name);
  const access = await db.query<{ insert: boolean; select: boolean; anon: boolean }>(
    `select has_table_privilege('authenticated', 'business_os.calendar_events', 'insert') as insert,
            has_table_privilege('authenticated', 'business_os.calendar_events', 'select') as select,
            has_table_privilege('anon', 'business_os.calendar_events', 'select') as anon`,
  );
  assert.deepEqual(access.rows[0], { insert: false, select: true, anon: false });
  await db.close();
});

test("calendar: events stay out of timeline_items, which feeds reminders", async () => {
  const { db } = await setup();
  const before = await db.query<{ def: string }>(`select pg_get_viewdef('business_os.timeline_items'::regclass) as def`);
  assert.doesNotMatch(before.rows[0].def, /calendar_events/);
  await call(db, "create_calendar_event", OWNER, event());
  const items = await db.query(`select 1 from business_os.timeline_items`);
  assert.equal(items.rows.length, 0);
  await db.close();
});
