import "server-only";
import { readFinanceRpc } from "@/lib/business-os/finance/rpc";
import { usageFromSum, type StorageUsage } from "@/lib/business-os/files/quota";

/** Stored document bytes for the actor's organization, summed in the database. */
export async function readStorageUsage(actorId: string): Promise<StorageUsage | { error: string }> {
  const read = await readFinanceRpc("document_storage_usage", { actor_id: actorId });
  if ("error" in read) return { error: read.error.message ?? "unavailable" };
  const row = (read.data ?? {}) as { usedBytes?: unknown; fileCount?: unknown };
  return usageFromSum(Number(row.usedBytes) || 0, Number(row.fileCount) || 0);
}
