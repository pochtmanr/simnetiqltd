import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { createSecretClient } from "@/lib/business-os/db/client";
import type { SyncClaim, SyncStore } from "@/lib/business-os/sync/worker";

function asClaim(value: unknown): SyncClaim | null {
  if (!value || typeof value !== "object") return null;
  return value as SyncClaim;
}

async function rpc(name: string, args: Record<string, unknown>): Promise<unknown> {
  const result = await createSecretClient().schema("business_os").rpc(name, args);
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export function secretStore(): SyncStore {
  return {
    async claim(workerId) {
      return asClaim(await rpc("claim_sync_lease", { worker_id: workerId, lease_seconds: 60 }));
    },
    async commitRecords(connectionId, workerId, page) {
      return rpc("commit_records_page", { target: connectionId, worker_id: workerId, page });
    },
    async commitSnapshot(connectionId, workerId, page) {
      return rpc("commit_snapshot_page", { target: connectionId, worker_id: workerId, page });
    },
    async resync(connectionId, workerId, endpoint) {
      return rpc("begin_resync", { target: connectionId, worker_id: workerId, target_endpoint: endpoint });
    },
    async fail(connectionId, workerId, endpoint, errorCode, retrySeconds, markStale, detail) {
      await rpc("record_sync_failure", {
        target: connectionId,
        worker_id: workerId,
        target_endpoint: endpoint,
        error_code: errorCode,
        error_detail: (detail ?? errorCode).slice(0, 200),
        retry_seconds: retrySeconds,
        mark_stale: markStale,
      });
    },
  };
}

/** Days of superseded snapshot copies and sync run rows kept before the tick deletes them. */
export const SYNC_HISTORY_DAYS = 30;

/** Deletes sync history older than the retention window. Current data and sales records are never touched. */
export async function pruneSyncHistory(): Promise<void> {
  await rpc("prune_sync_history", { keep_days: SYNC_HISTORY_DAYS });
}

export function jobAuthorized(header: string | null, secret: string | null): boolean {
  if (!secret) return false;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  const left = createHash("sha256").update(token).digest();
  const right = createHash("sha256").update(secret).digest();
  return timingSafeEqual(left, right);
}

const SECRET_NAME = /^[A-Z][A-Z0-9_]{2,64}$/;

export function readSourceSecret(reference: string): string | null {
  if (!SECRET_NAME.test(reference)) return null;
  const value = process.env[reference]?.trim();
  return value ? value : null;
}
