import { unseal } from "@/lib/business-os/providers/seal";
import {
  RevolutError,
  fetchAccounts,
  fetchTransactionsSince,
  refreshAccess,
  type BankAccountRow,
  type BankTransactionRow,
  type RevolutConfig,
} from "@/lib/business-os/providers/revolut";

export type BankSyncState = { organizationId: string; sealed: string; newestCreatedAt: string | null; oldestPendingAt: string | null };

export type BankSyncStore = {
  state(): Promise<BankSyncState | null>;
  ingest(organizationId: string, accounts: BankAccountRow[], transactions: BankTransactionRow[]): Promise<{ inserted: number; updated: number }>;
  record(organizationId: string, startedAt: Date, outcome: string, rows: number): Promise<void>;
};

/** History pulled on the first sync: enough for a full year of statements plus a margin. */
export const BACKFILL_DAYS = 400;
/** Re-read window on later syncs, so late state changes (pending → completed, reverted) are picked up. */
export const OVERLAP_DAYS = 14;
const CHUNK = 2000;
const DAY = 86_400_000;

/** Where a sync resumes: 14 days before the newest row, or earlier if something is still pending. */
export function syncFrom(state: Pick<BankSyncState, "newestCreatedAt" | "oldestPendingAt">, now: Date): Date {
  if (!state.newestCreatedAt) return new Date(now.getTime() - BACKFILL_DAYS * DAY);
  const overlap = new Date(new Date(state.newestCreatedAt).getTime() - OVERLAP_DAYS * DAY);
  if (state.oldestPendingAt && new Date(state.oldestPendingAt) < overlap) return new Date(state.oldestPendingAt);
  return overlap;
}

export type BankSyncOutcome = "not_connected" | "committed" | "reconnect_required" | "rate_limited" | "unavailable" | "response_invalid" | "token_invalid" | "commit_failed";

export async function runBankSync(
  store: BankSyncStore,
  input: { config: RevolutConfig; key: Buffer; now?: Date; fetcher?: typeof fetch },
): Promise<{ outcome: BankSyncOutcome; rows: number }> {
  const now = input.now ?? new Date();
  const state = await store.state();
  if (!state) return { outcome: "not_connected", rows: 0 };
  const finish = async (outcome: BankSyncOutcome, rows = 0) => {
    await store.record(state.organizationId, now, outcome, rows);
    return { outcome, rows };
  };

  let refreshToken: string;
  try {
    refreshToken = unseal(state.sealed, "revolut", input.key);
  } catch {
    return finish("token_invalid");
  }

  let accounts: BankAccountRow[];
  let transactions: BankTransactionRow[];
  try {
    const access = await refreshAccess(input.config, refreshToken, input.fetcher);
    accounts = await fetchAccounts(input.config, access, input.fetcher, now);
    transactions = await fetchTransactionsSince(input.config, access, syncFrom(state, now), input.fetcher);
  } catch (error) {
    return finish(error instanceof RevolutError ? error.code : "unavailable");
  }

  // Legs on accounts the bank no longer lists (closed) cannot be stored against an account; skip them.
  const known = new Set(accounts.map((account) => account.external_id));
  const usable = transactions.filter((row) => known.has(row.account_external_id));
  let written = 0;
  try {
    for (let start = 0; start === 0 || start < usable.length; start += CHUNK) {
      const result = await store.ingest(state.organizationId, start === 0 ? accounts : [], usable.slice(start, start + CHUNK));
      written += result.inserted + result.updated;
    }
  } catch {
    return finish("commit_failed", written);
  }
  return finish("committed", written);
}
