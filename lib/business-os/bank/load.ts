import "server-only";
import { userDb } from "@/lib/business-os/brain/read";
import { readRevolutConfig } from "@/lib/business-os/providers/revolut";
import type { WorkspaceQuery } from "@/lib/business-os/workspace/filters";

export type BankAccount = { id: string; name: string | null; currency: string; balance: string; state: string; asOf: string };

export type BankTransaction = {
  id: string;
  accountId: string;
  kind: string;
  state: string;
  createdAt: string;
  completedAt: string | null;
  amount: string;
  fee: string;
  currency: string;
  description: string | null;
  counterparty: string | null;
  reference: string | null;
  category: string | null;
  categorySource: "rule" | "manual" | null;
};

export type BankRule = { id: string; match: string; category: string };

export type BankRun = { outcome: string; finishedAt: string; rows: number };

export type BankData = {
  /** REVOLUT_* env is present, so Connect can start. */
  configured: boolean;
  connectedAt: string | null;
  lastRun: BankRun | null;
  lastSuccessAt: string | null;
  accounts: BankAccount[];
  /** Transactions created in the selected period, newest first. */
  transactions: BankTransaction[];
  /** True when the period holds more rows than were loaded. */
  truncated: boolean;
  rules: BankRule[];
};

export const BANK_TRANSACTION_LIMIT = 3000;

const text = (value: unknown): string | null => (typeof value === "string" ? value : null);

/** Bank data for the Bank tab, read with the signed-in user's client so row-level security applies. */
export async function loadBank(query: Pick<WorkspaceQuery, "from" | "to">): Promise<BankData | { error: string }> {
  const db = await userDb();
  if (!db) return { error: "unauthenticated" };
  const [connection, runs, success, accounts, transactions, rules] = await Promise.all([
    db.from("provider_tokens").select("connected_at").eq("provider", "revolut").maybeSingle(),
    db.from("provider_runs").select("outcome, finished_at, rows_written").eq("provider", "revolut").order("finished_at", { ascending: false }).limit(1),
    db.from("provider_runs").select("finished_at").eq("provider", "revolut").eq("outcome", "committed").order("finished_at", { ascending: false }).limit(1),
    db.from("bank_accounts").select("id, name, currency, balance::text, state, as_of").order("currency"),
    db
      .from("bank_transactions")
      .select("id, account_id, kind, state, created_at, completed_at, amount::text, fee::text, currency, description, counterparty, reference, category, category_source")
      .gte("created_at", query.from)
      .lt("created_at", query.to)
      .order("created_at", { ascending: false })
      .limit(BANK_TRANSACTION_LIMIT + 1),
    db.from("bank_category_rules").select("id, match, category").order("match"),
  ]);
  if (connection.error || runs.error || success.error || accounts.error || transactions.error || rules.error) return { error: "unavailable" };

  const run = runs.data?.[0];
  const txRows = transactions.data ?? [];
  return {
    configured: readRevolutConfig() !== null,
    connectedAt: text(connection.data?.connected_at),
    lastRun: run ? { outcome: String(run.outcome), finishedAt: String(run.finished_at), rows: Number(run.rows_written) } : null,
    lastSuccessAt: text(success.data?.[0]?.finished_at),
    accounts: (accounts.data ?? []).map((row) => ({
      id: String(row.id),
      name: text(row.name),
      currency: String(row.currency),
      balance: String(row.balance),
      state: String(row.state),
      asOf: String(row.as_of),
    })),
    transactions: txRows.slice(0, BANK_TRANSACTION_LIMIT).map((row) => ({
      id: String(row.id),
      accountId: String(row.account_id),
      kind: String(row.kind),
      state: String(row.state),
      createdAt: String(row.created_at),
      completedAt: text(row.completed_at),
      amount: String(row.amount),
      fee: String(row.fee),
      currency: String(row.currency),
      description: text(row.description),
      counterparty: text(row.counterparty),
      reference: text(row.reference),
      category: text(row.category),
      categorySource: row.category_source === "rule" || row.category_source === "manual" ? row.category_source : null,
    })),
    truncated: txRows.length > BANK_TRANSACTION_LIMIT,
    rules: (rules.data ?? []).map((row) => ({ id: String(row.id), match: String(row.match), category: String(row.category) })),
  };
}
