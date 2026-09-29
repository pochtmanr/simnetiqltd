import "server-only";
import { createSecretClient } from "@/lib/business-os/db/client";
import type { OperationsStore, ReminderClaim } from "@/lib/business-os/operations/tick";
import type { SendOutcome } from "@/lib/business-os/operations/delivery";

async function rpc(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
  const result = await createSecretClient().schema("business_os").rpc(name, args);
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

function asNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function asClaims(value: unknown): ReminderClaim[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    if (typeof row.id !== "string" || typeof row.title !== "string" || typeof row.path !== "string" || typeof row.chatId !== "string") {
      return [];
    }
    return [{ id: row.id, title: row.title, path: row.path, chatId: row.chatId }];
  });
}

export function operationsStore(): OperationsStore {
  return {
    async materialize(asOf) {
      return asNumber(await rpc("materialize_recurring_drafts", { as_of: asOf }));
    },
    async quarantine() {
      return asNumber(await rpc("quarantine_orphan_uploads"));
    },
    async enqueue(asOf) {
      return asNumber(await rpc("enqueue_reminders", { as_of: asOf }));
    },
    async claim(localTime) {
      return asClaims(await rpc("claim_reminders", { local_time: localTime, batch_limit: 20 }));
    },
    async finish(id, outcome: SendOutcome | "suppressed") {
      await rpc("finish_reminder", { occurrence_id: id, outcome });
    },
  };
}
