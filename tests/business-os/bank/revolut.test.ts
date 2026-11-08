import assert from "node:assert/strict";
import { createVerify, generateKeyPairSync, randomBytes } from "node:crypto";
import test from "node:test";
import { runBankSync, syncFrom, type BankSyncStore } from "@/lib/business-os/providers/bank-sync";
import { pemFromEnv, signRs256 } from "@/lib/business-os/providers/jwt";
import { clientAssertion, consentUrl, fetchTransactionsSince, mapTransactions, readRevolutConfig, type RevolutConfig } from "@/lib/business-os/providers/revolut";
import { seal, tokenKey, unseal } from "@/lib/business-os/providers/seal";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const config: RevolutConfig = { clientId: "client-1", privateKey: pem, redirectUri: "https://ops.example.com/api/business-os/providers/revolut/callback", sandbox: false };

function decode(jwt: string) {
  const [header, payload, signature] = jwt.split(".");
  const valid = createVerify("RSA-SHA256").update(`${header}.${payload}`).verify(publicKey, Buffer.from(signature, "base64url"));
  return { header: JSON.parse(Buffer.from(header, "base64url").toString()), payload: JSON.parse(Buffer.from(payload, "base64url").toString()), valid };
}

test("seal round-trips and refuses another provider, another key, or tampering", () => {
  const key = randomBytes(32);
  const sealed = seal("refresh-123", "revolut", key);
  assert.match(sealed, /^v1\.[\w-]+\.[\w-]+\.[\w-]+$/);
  assert.equal(unseal(sealed, "revolut", key), "refresh-123");
  assert.throws(() => unseal(sealed, "google", key));
  assert.throws(() => unseal(sealed, "revolut", randomBytes(32)));
  const parts = sealed.split(".");
  parts[3] = Buffer.from("tampered").toString("base64url");
  assert.throws(() => unseal(parts.join("."), "revolut", key));
  assert.throws(() => tokenKey("too-short"), /token_key_invalid/);
  assert.equal(tokenKey(key.toString("base64")).length, 32);
});

test("RS256 JWT verifies with the public key, including an env-escaped PEM", () => {
  const token = signRs256({ sub: "x" }, pem.replaceAll("\n", "\\n"));
  const { header, payload, valid } = decode(token);
  assert.equal(valid, true);
  assert.deepEqual(header, { alg: "RS256", typ: "JWT" });
  assert.deepEqual(payload, { sub: "x" });
  assert.equal(pemFromEnv("a\\nb"), "a\nb");
});

test("Revolut client assertion and consent URL", () => {
  const { payload, valid } = decode(clientAssertion(config, Date.UTC(2026, 10, 8)));
  assert.equal(valid, true);
  assert.deepEqual(payload, { iss: "ops.example.com", sub: "client-1", aud: "https://revolut.com", exp: Date.UTC(2026, 10, 8) / 1000 + 300 });
  const url = new URL(consentUrl(config, "st4te"));
  assert.equal(url.origin + url.pathname, "https://business.revolut.com/app-confirm");
  assert.equal(url.searchParams.get("scope"), "READ");
  assert.equal(url.searchParams.get("state"), "st4te");
  assert.equal(new URL(consentUrl({ ...config, sandbox: true }, "s")).host, "sandbox-business.revolut.com");
  assert.equal(readRevolutConfig({ REVOLUT_CLIENT_ID: "a" }), null);
  assert.equal(readRevolutConfig({ REVOLUT_CLIENT_ID: "a", REVOLUT_PRIVATE_KEY: "k", REVOLUT_REDIRECT_URI: "https://x", REVOLUT_ENVIRONMENT: "sandbox" })?.sandbox, true);
});

const card = {
  id: "tx-card",
  type: "card_payment",
  state: "completed",
  created_at: "2026-11-01T09:00:00.000Z",
  updated_at: "2026-11-01T09:05:00.000Z",
  completed_at: "2026-11-01T09:05:00.000Z",
  merchant: { name: "Microsoft Azure" },
  legs: [{ leg_id: "l1", account_id: "acc-gbp", amount: -42.5, fee: 0, currency: "GBP", description: "Microsoft*Azure", balance: 1520.4 }],
};

const exchange = {
  id: "tx-fx",
  type: "exchange",
  state: "completed",
  created_at: "2026-11-02T09:00:00.000Z",
  updated_at: "2026-11-02T09:00:00.000Z",
  legs: [
    { leg_id: "a", account_id: "acc-gbp", amount: -100, currency: "GBP", description: "Exchanged to EUR", counterparty: { account_type: "self" } },
    { leg_id: "b", account_id: "acc-eur", amount: 115.2, currency: "EUR", description: "Exchanged from GBP", counterparty: { account_type: "self" } },
  ],
};

test("transactions map to one row per leg; exchanges default to own-account transfer", () => {
  const rows = mapTransactions([card, exchange, { id: "broken", legs: "nope" }]);
  assert.equal(rows.length, 3);
  assert.deepEqual(
    rows.map((row) => [row.external_id, row.amount, row.currency, row.counterparty, row.default_category]),
    [
      ["tx-card:l1", "-42.5", "GBP", "Microsoft Azure", null],
      ["tx-fx:a", "-100", "GBP", null, "internal_transfer"],
      ["tx-fx:b", "115.2", "EUR", null, "internal_transfer"],
    ],
  );
  assert.equal(rows[0].balance_after, "1520.4");
});

test("paging walks back with an exclusive `to` and stops on a short page", async () => {
  const seen: string[] = [];
  const page = (count: number, start: number) =>
    Array.from({ length: count }, (_, index) => ({
      ...card,
      id: `t${start + index}`,
      created_at: new Date(Date.UTC(2026, 10, 1) - (start + index) * 60_000).toISOString(),
    }));
  const fetcher = (async (input: string | URL | Request) => {
    const url = new URL(String(input));
    seen.push(url.searchParams.get("to") ?? "-");
    const body = seen.length === 1 ? page(1000, 0) : page(10, 1000);
    return new Response(JSON.stringify(body), { status: 200 });
  }) as typeof fetch;
  const rows = await fetchTransactionsSince(config, "token", new Date("2025-10-01T00:00:00Z"), fetcher);
  assert.equal(rows.length, 1010);
  assert.equal(seen.length, 2);
  assert.equal(seen[0], "-");
  // Oldest of page one plus 1 ms, so a sibling with the same timestamp is not skipped.
  assert.equal(seen[1], new Date(Date.UTC(2026, 10, 1) - 999 * 60_000 + 1).toISOString());
});

test("sync resumes 14 days back, or from the oldest pending row", () => {
  const now = new Date("2026-11-08T00:00:00Z");
  assert.equal(syncFrom({ newestCreatedAt: null, oldestPendingAt: null }, now).toISOString(), "2025-10-04T00:00:00.000Z");
  assert.equal(syncFrom({ newestCreatedAt: "2026-11-07T00:00:00Z", oldestPendingAt: null }, now).toISOString(), "2026-10-24T00:00:00.000Z");
  assert.equal(syncFrom({ newestCreatedAt: "2026-11-07T00:00:00Z", oldestPendingAt: "2026-09-01T00:00:00Z" }, now).toISOString(), "2026-09-01T00:00:00.000Z");
});

function fakeStore(sealed: string | null) {
  const ingested: { accounts: number; transactions: string[] }[] = [];
  const runs: string[] = [];
  const store: BankSyncStore = {
    async state() {
      return sealed ? { organizationId: "org", sealed, newestCreatedAt: null, oldestPendingAt: null } : null;
    },
    async ingest(_org, accounts, transactions) {
      ingested.push({ accounts: accounts.length, transactions: transactions.map((row) => row.external_id) });
      return { inserted: transactions.length, updated: 0 };
    },
    async record(_org, _started, outcome) {
      runs.push(outcome);
    },
  };
  return { store, ingested, runs };
}

test("bank sync: refreshes, pulls, skips legs on unlisted accounts, and records the run", async () => {
  const key = randomBytes(32);
  const { store, ingested, runs } = fakeStore(seal("refresh-1", "revolut", key));
  const calls: string[] = [];
  const fetcher = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    calls.push(url.pathname);
    if (url.pathname.endsWith("/auth/token")) {
      const form = new URLSearchParams(String(init?.body));
      assert.equal(form.get("grant_type"), "refresh_token");
      assert.equal(form.get("refresh_token"), "refresh-1");
      return new Response(JSON.stringify({ access_token: "access-1", expires_in: 2399 }));
    }
    assert.equal(new Headers(init?.headers).get("authorization"), "Bearer access-1");
    if (url.pathname.endsWith("/accounts")) return new Response(JSON.stringify([{ id: "acc-gbp", name: "Main", balance: 1520.4, currency: "GBP", state: "active" }]));
    return new Response(JSON.stringify([card, exchange]));
  }) as typeof fetch;

  const result = await runBankSync(store, { config, key, fetcher, now: new Date("2026-11-08T00:00:00Z") });
  assert.deepEqual(result, { outcome: "committed", rows: 2 });
  assert.deepEqual(calls, ["/api/1.0/auth/token", "/api/1.0/accounts", "/api/1.0/transactions"]);
  assert.deepEqual(ingested, [{ accounts: 1, transactions: ["tx-card:l1", "tx-fx:a"] }]);
  assert.deepEqual(runs, ["committed"]);
});

test("bank sync: a rejected refresh asks for a reconnect; no token means not connected", async () => {
  const key = randomBytes(32);
  const { store, runs } = fakeStore(seal("old", "revolut", key));
  const fetcher = (async () => new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 })) as typeof fetch;
  assert.deepEqual(await runBankSync(store, { config, key, fetcher }), { outcome: "reconnect_required", rows: 0 });
  assert.deepEqual(runs, ["reconnect_required"]);

  assert.deepEqual(await runBankSync(fakeStore(null).store, { config, key, fetcher }), { outcome: "not_connected", rows: 0 });
  const wrongKey = fakeStore(seal("x", "revolut", randomBytes(32)));
  assert.deepEqual(await runBankSync(wrongKey.store, { config, key, fetcher }), { outcome: "token_invalid", rows: 0 });
});
