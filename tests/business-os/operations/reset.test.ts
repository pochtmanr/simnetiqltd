import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (name: string) => readFileSync(join(root, "supabase/business-os/migrations", name), "utf8");

const resetSql = read("20260929000000_reset_reused_project.sql");
const chain = [
  "20260929120000_identity_foundation.sql",
  "20260929150000_finance_core.sql",
  "20260929180000_project_pulls.sql",
  "20260929210000_reconciliation.sql",
  "20260929240000_documents_registry.sql",
].map(read);

const preamble = `
  create schema if not exists auth;
  create table if not exists auth.users (id uuid primary key, email text);
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

test("reset refuses VisaPassage and Doppler fingerprints", async () => {
  const visa = new PGlite();
  await visa.exec(`create table public.visa_applications (id int);`);
  await assert.rejects(() => visa.exec(resetSql), /refusing reset/);
  await visa.close();

  const doppler = new PGlite();
  await doppler.exec(`create table public.marketing_contacts (id int); create table public.vpn_servers (id int);`);
  await assert.rejects(() => doppler.exec(resetSql), /refusing reset/);
  await doppler.close();
});

test("reset clears a closed project and the Business OS chain applies", async () => {
  const db = new PGlite();
  await db.exec(preamble);
  await db.exec(`
    create table public.esim_orders (id int);
    insert into storage.buckets (id, name, public) values ('old-esim', 'old-esim', true);
    insert into storage.objects (bucket_id, name) values ('old-esim', 'qr.png');
  `);
  await db.exec(resetSql);
  const leftover = await db.query<{ name: string }>(
    `select relname as name from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = 'esim_orders'`,
  );
  assert.equal(leftover.rows.length, 0);
  const buckets = await db.query<{ count: number }>(`select count(*)::int as count from storage.buckets`);
  assert.equal(buckets.rows[0].count, 1);

  for (const sql of chain) await db.exec(sql);
  const org = await db.query<{ slug: string }>(`select slug from business_os.organizations`);
  assert.deepEqual(org.rows, [{ slug: "simnetiq" }]);
  const prefs = await db.query<{ consent: boolean }>(`select consent from business_os.reminder_preferences`);
  assert.equal(prefs.rows[0].consent, false);
  await db.close();
});
