import { signRs256 } from "@/lib/business-os/providers/jwt";

/**
 * Revolut Business API, read-only (scope READ). The API side follows Revolut's
 * published OpenAPI spec (revolut-engineering/revolut-openapi, business.yaml):
 * /accounts, and /transactions newest-first with an exclusive `to` for paging.
 * The auth flow (app-confirm consent, /auth/token, client-assertion claims)
 * follows the developer guide; verify it against the sandbox on first setup.
 */

export type RevolutConfig = {
  clientId: string;
  privateKey: string;
  redirectUri: string;
  sandbox: boolean;
};

export function readRevolutConfig(env: Record<string, string | undefined> = process.env): RevolutConfig | null {
  const clientId = env.REVOLUT_CLIENT_ID?.trim();
  const privateKey = env.REVOLUT_PRIVATE_KEY?.trim();
  const redirectUri = env.REVOLUT_REDIRECT_URI?.trim();
  if (!clientId || !privateKey || !redirectUri) return null;
  return { clientId, privateKey, redirectUri, sandbox: env.REVOLUT_ENVIRONMENT?.trim() === "sandbox" };
}

const apiBase = (config: RevolutConfig) => (config.sandbox ? "https://sandbox-b2b.revolut.com/api/1.0" : "https://b2b.revolut.com/api/1.0");

export function consentUrl(config: RevolutConfig, state: string): string {
  const host = config.sandbox ? "https://sandbox-business.revolut.com" : "https://business.revolut.com";
  const params = new URLSearchParams({ client_id: config.clientId, redirect_uri: config.redirectUri, response_type: "code", scope: "READ", state });
  return `${host}/app-confirm?${params.toString()}`;
}

/** The client-assertion JWT: issuer is the redirect URI's host, subject the client id. */
export function clientAssertion(config: RevolutConfig, now = Date.now()): string {
  return signRs256(
    { iss: new URL(config.redirectUri).hostname, sub: config.clientId, aud: "https://revolut.com", exp: Math.floor(now / 1000) + 300 },
    config.privateKey,
  );
}

export class RevolutError extends Error {
  constructor(
    readonly code: "reconnect_required" | "rate_limited" | "unavailable" | "response_invalid",
    readonly status?: number,
  ) {
    super(code);
  }
}

type Fetch = typeof fetch;

async function tokenRequest(config: RevolutConfig, form: Record<string, string>, fetcher: Fetch): Promise<{ accessToken: string; refreshToken: string | null }> {
  const body = new URLSearchParams({
    ...form,
    client_id: config.clientId,
    client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: clientAssertion(config),
  });
  const response = await fetcher(`${apiBase(config)}/auth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(15_000),
  });
  if (response.status === 400 || response.status === 401) throw new RevolutError("reconnect_required", response.status);
  if (!response.ok) throw new RevolutError(response.status === 429 ? "rate_limited" : "unavailable", response.status);
  const json = (await response.json()) as { access_token?: unknown; refresh_token?: unknown };
  if (typeof json.access_token !== "string") throw new RevolutError("response_invalid");
  return { accessToken: json.access_token, refreshToken: typeof json.refresh_token === "string" ? json.refresh_token : null };
}

export async function exchangeCode(config: RevolutConfig, code: string, fetcher: Fetch = fetch) {
  const tokens = await tokenRequest(config, { grant_type: "authorization_code", code }, fetcher);
  if (!tokens.refreshToken) throw new RevolutError("response_invalid");
  return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
}

export async function refreshAccess(config: RevolutConfig, refreshToken: string, fetcher: Fetch = fetch): Promise<string> {
  return (await tokenRequest(config, { grant_type: "refresh_token", refresh_token: refreshToken }, fetcher)).accessToken;
}

async function getJson(config: RevolutConfig, accessToken: string, path: string, fetcher: Fetch): Promise<unknown> {
  const response = await fetcher(`${apiBase(config)}${path}`, {
    headers: { authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(30_000),
  });
  if (response.status === 401 || response.status === 403) throw new RevolutError("reconnect_required", response.status);
  if (response.status === 429) throw new RevolutError("rate_limited", 429);
  if (!response.ok) throw new RevolutError("unavailable", response.status);
  return response.json();
}

/* ---------- Mapping to the ingest_bank_page shapes ---------- */

export type BankAccountRow = { external_id: string; name: string | null; currency: string; balance: string; state: string; as_of: string };

export type BankTransactionRow = {
  external_id: string;
  account_external_id: string;
  kind: string;
  state: string;
  created_at: string;
  completed_at: string | null;
  amount: string;
  fee: string;
  currency: string;
  balance_after: string | null;
  description: string | null;
  counterparty: string | null;
  reference: string | null;
  default_category: string | null;
  raw: unknown;
};

type RevolutLeg = {
  leg_id?: unknown;
  account_id?: unknown;
  amount?: unknown;
  fee?: unknown;
  currency?: unknown;
  description?: unknown;
  balance?: unknown;
  counterparty?: { account_type?: unknown } | null;
};

type RevolutTransaction = {
  id?: unknown;
  type?: unknown;
  state?: unknown;
  created_at?: unknown;
  completed_at?: unknown;
  reference?: unknown;
  merchant?: { name?: unknown } | null;
  legs?: unknown;
};

const str = (value: unknown): string | null => (typeof value === "string" && value.trim() !== "" ? value : null);
const num = (value: unknown): string | null => (typeof value === "number" && Number.isFinite(value) ? String(value) : null);

export function mapAccounts(body: unknown, asOf: string): BankAccountRow[] {
  if (!Array.isArray(body)) throw new RevolutError("response_invalid");
  return body.flatMap((item) => {
    const id = str(item?.id);
    const currency = str(item?.currency);
    const balance = num(item?.balance);
    if (!id || !currency || balance === null) return [];
    return [{ external_id: id, name: str(item.name), currency, balance, state: str(item.state) ?? "active", as_of: asOf }];
  });
}

/** One row per leg. A leg to one of our own accounts, or any exchange, defaults to "internal_transfer". */
export function mapTransactions(body: unknown): BankTransactionRow[] {
  if (!Array.isArray(body)) throw new RevolutError("response_invalid");
  return (body as RevolutTransaction[]).flatMap((tx) => {
    const id = str(tx.id);
    const created = str(tx.created_at);
    if (!id || !created || !Array.isArray(tx.legs)) return [];
    return (tx.legs as RevolutLeg[]).flatMap((leg) => {
      const legId = str(leg.leg_id);
      const account = str(leg.account_id);
      const amount = num(leg.amount);
      const currency = str(leg.currency);
      if (!legId || !account || amount === null || !currency) return [];
      const own = leg.counterparty?.account_type === "self" || tx.type === "exchange";
      return [
        {
          external_id: `${id}:${legId}`,
          account_external_id: account,
          kind: str(tx.type) ?? "unknown",
          state: str(tx.state) ?? "unknown",
          created_at: created,
          completed_at: str(tx.completed_at),
          amount,
          fee: num(leg.fee) ?? "0",
          currency,
          balance_after: num(leg.balance),
          description: str(leg.description),
          counterparty: str(tx.merchant?.name),
          reference: str(tx.reference),
          default_category: own ? "internal_transfer" : null,
          raw: tx,
        },
      ];
    });
  });
}

/* ---------- Pulling ---------- */

export async function fetchAccounts(config: RevolutConfig, accessToken: string, fetcher: Fetch = fetch, now = new Date()): Promise<BankAccountRow[]> {
  return mapAccounts(await getJson(config, accessToken, "/accounts", fetcher), now.toISOString());
}

export const PAGE_SIZE = 1000;
const MAX_PAGES = 60;

/**
 * Every transaction created at or after `from`, newest first. The next page's
 * `to` (exclusive) is the oldest `created_at` of the page plus 1 ms, so a
 * transaction sharing that timestamp is fetched again rather than skipped; the
 * ingest upserts, so a repeat is harmless.
 */
export async function fetchTransactionsSince(config: RevolutConfig, accessToken: string, from: Date, fetcher: Fetch = fetch): Promise<BankTransactionRow[]> {
  const rows = new Map<string, BankTransactionRow>();
  let to: string | null = null;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const params = new URLSearchParams({ from: from.toISOString(), count: String(PAGE_SIZE) });
    if (to) params.set("to", to);
    const body = await getJson(config, accessToken, `/transactions?${params.toString()}`, fetcher);
    if (!Array.isArray(body)) throw new RevolutError("response_invalid");
    for (const row of mapTransactions(body)) rows.set(row.external_id, row);
    if (body.length < PAGE_SIZE) break;
    const oldest = str((body[body.length - 1] as RevolutTransaction).created_at);
    if (!oldest) break;
    const next = new Date(new Date(oldest).getTime() + 1).toISOString();
    if (next === to) break;
    to = next;
  }
  return [...rows.values()];
}
