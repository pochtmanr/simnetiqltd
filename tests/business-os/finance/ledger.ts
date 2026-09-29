import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

export const identitySql = readFileSync(
  join(root, "supabase/business-os/migrations/20260929120000_identity_foundation.sql"),
  "utf8",
);
export const financeSql = readFileSync(
  join(root, "supabase/business-os/migrations/20260929150000_finance_core.sql"),
  "utf8",
);

export const ownerId = "11111111-1111-4111-8111-111111111111";
export const adminId = "33333333-3333-4333-8333-333333333333";
export const readerId = "22222222-2222-4222-8222-222222222222";

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

export function hash(seed: number): string {
  return seed.toString(16).padStart(64, "a");
}

export function observation(overrides: Record<string, unknown> = {}) {
  return {
    project_slug: "doppler",
    environment: "local",
    external_object_id: "sale-1",
    event_kind: "sale",
    external_adjustment_id: "",
    revision: 1,
    record_type: "sale",
    recognition_basis: "purchase",
    posting: true,
    posting_role: "primary",
    economic_transaction_id: "econ-1",
    counts_as_new_revenue: true,
    original_amount: "10.00",
    original_currency: "GBP",
    quality: "actual",
    occurred_at: "2026-05-01T12:00:00.000Z",
    formula_version: "test-v1",
    content_hash: hash(1),
    debit_account: "clearing-gbp",
    credit_account: "revenue-gbp",
    ...overrides,
  };
}

export async function withLedger(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(preamble);
  await db.exec(identitySql);
  await db.exec(financeSql);
  await db.exec(`
    insert into auth.users (id, email) values
      ('${ownerId}', 'owner@example.test'),
      ('${adminId}', 'admin@example.test'),
      ('${readerId}', 'reader@example.test');
    select business_os.grant_owner('${ownerId}'::uuid);
    insert into business_os.memberships (organization_id, user_id, role)
    select id, '${adminId}'::uuid, 'admin' from business_os.organizations where slug = 'simnetiq';
    insert into business_os.memberships (organization_id, user_id, role)
    select id, '${readerId}'::uuid, 'read_only' from business_os.organizations where slug = 'simnetiq';
  `);
  return db;
}

export function json<T>(value: unknown): T {
  return (typeof value === "string" ? JSON.parse(value) : value) as T;
}

export async function postObservation(db: PGlite, actor: string, payload: Record<string, unknown>) {
  const rows = await db.query<{ result: unknown }>(
    `select business_os.post_source_observation($1::uuid, $2::jsonb) as result`,
    [actor, JSON.stringify(payload)],
  );
  return json<Record<string, string | null>>(rows.rows[0].result);
}

export async function moneyIs(db: PGlite, actual: string | null, expected: string): Promise<boolean> {
  const rows = await db.query<{ ok: boolean }>(`select $1::numeric = $2::numeric as ok`, [actual, expected]);
  return rows.rows[0].ok;
}

export async function queryAs(db: PGlite, role: string, sub: string | null, sql: string, params: unknown[] = []) {
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
