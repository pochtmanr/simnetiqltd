import "server-only";
import { createSecretClient } from "@/lib/business-os/db/client";
import type { BankSyncStore } from "@/lib/business-os/providers/bank-sync";

async function rpc(name: string, args: Record<string, unknown>): Promise<unknown> {
  const result = await createSecretClient().schema("business_os").rpc(name, args);
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

/** The bank sync's database side: every call is a service-role RPC from 20261108140000_bank.sql. */
export function bankStore(provider: "revolut"): BankSyncStore {
  return {
    async state() {
      const rows = (await rpc("provider_sync_state", { target_provider: provider })) as
        | { organization_id: string; sealed: string; newest_created_at: string | null; oldest_pending_at: string | null }[]
        | null;
      const row = rows?.[0];
      if (!row) return null;
      return { organizationId: row.organization_id, sealed: row.sealed, newestCreatedAt: row.newest_created_at, oldestPendingAt: row.oldest_pending_at };
    },
    async ingest(organizationId, accounts, transactions) {
      return (await rpc("ingest_bank_page", { org_id: organizationId, target_provider: provider, accounts, transactions })) as { inserted: number; updated: number };
    },
    async record(organizationId, startedAt, outcome, rows) {
      await rpc("record_provider_run", { org_id: organizationId, target_provider: provider, run_started_at: startedAt.toISOString(), run_outcome: outcome, run_rows: rows });
    },
  };
}
