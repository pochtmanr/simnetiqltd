import { londonDate, londonTime } from "@/lib/business-os/finance/london";
import { reminderMessage, type SendOutcome } from "@/lib/business-os/operations/delivery";

export type ReminderClaim = {
  id: string;
  title: string;
  path: string;
  chatId: string;
};

export type OperationsStore = {
  materialize(asOf: string): Promise<number>;
  quarantine(): Promise<number>;
  enqueue(asOf: string): Promise<number>;
  claim(localTime: string): Promise<ReminderClaim[]>;
  finish(id: string, outcome: SendOutcome | "suppressed"): Promise<void>;
};

export type TickResult = {
  materialized: number;
  orphaned: number;
  enqueued: number;
  sent: number;
  failed: number;
  ambiguous: number;
  suppressed: number;
};

function emptyCounts(): TickResult {
  return { materialized: 0, orphaned: 0, enqueued: 0, sent: 0, failed: 0, ambiguous: 0, suppressed: 0 };
}

export async function runOperationsTick(
  store: OperationsStore,
  options: {
    now: Date;
    transportReady: boolean;
    send: (claim: ReminderClaim & { text: string }) => Promise<SendOutcome>;
  },
): Promise<TickResult> {
  const result = emptyCounts();
  const asOf = londonDate(options.now);
  result.materialized = await store.materialize(asOf);
  result.orphaned = await store.quarantine();
  result.enqueued = await store.enqueue(asOf);
  if (!options.transportReady) return result;
  const claims = await store.claim(londonTime(options.now));
  for (const claim of claims) {
    let outcome: SendOutcome;
    try {
      outcome = await options.send({ ...claim, text: reminderMessage(claim.title, claim.path) });
    } catch (error) {
      outcome = error instanceof Error && error.name === "AbortError" ? "ambiguous" : "failed";
    }
    await store.finish(claim.id, outcome);
    if (outcome === "sent") result.sent += 1;
    else if (outcome === "ambiguous") result.ambiguous += 1;
    else result.failed += 1;
  }
  return result;
}
