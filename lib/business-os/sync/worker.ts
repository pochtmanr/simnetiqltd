import { mapRecordsPage, snapshotPage } from "@/lib/business-os/sync/map";
import { pullSigned, type PullResult } from "@/lib/business-os/sync/pull";
import { schemaForEndpoint, validateContract } from "@/lib/business-os/sync/validate";

export type SyncClaim = {
  connection_id: string;
  project_slug: string;
  environment: string;
  source_environment: string;
  base_url: string;
  key_id: string;
  secret_reference: string;
  endpoint: string;
  cursor: string | null;
  initial_from: string;
  initial_to: string;
  page_limit: number;
  recognition_basis: string;
  timezone: string;
};

export type SyncStore = {
  claim(workerId: string): Promise<SyncClaim | null>;
  commitRecords(connectionId: string, workerId: string, page: unknown): Promise<unknown>;
  commitSnapshot(connectionId: string, workerId: string, page: unknown): Promise<unknown>;
  resync(connectionId: string, workerId: string, endpoint: string): Promise<unknown>;
  fail(
    connectionId: string,
    workerId: string,
    endpoint: string,
    errorCode: string,
    retrySeconds: number,
    markStale: boolean,
  ): Promise<void>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

export async function runSyncTick(
  store: SyncStore,
  input: {
    workerId: string;
    secretFor: (reference: string) => string | null;
    pull?: typeof pullSigned;
  },
): Promise<{ claimed: false } | { claimed: true; outcome: string }> {
  const claim = await store.claim(input.workerId);
  if (!claim) return { claimed: false };
  const secret = input.secretFor(claim.secret_reference);
  if (!secret) {
    await store.fail(claim.connection_id, input.workerId, claim.endpoint, "source_secret_missing", 3600, false);
    return { claimed: true, outcome: "source_secret_missing" };
  }
  const pull = input.pull ?? pullSigned;
  let result: PullResult;
  try {
    result = await pull({
      claim,
      baseUrl: claim.base_url,
      keyId: claim.key_id,
      secret,
    });
  } catch {
    await store.fail(claim.connection_id, input.workerId, claim.endpoint, "timeout", 60, true);
    return { claimed: true, outcome: "timeout" };
  }
  if (result.kind === "resync") {
    await store.resync(claim.connection_id, input.workerId, claim.endpoint);
    return { claimed: true, outcome: "resync" };
  }
  if (result.kind === "retry") {
    await store.fail(claim.connection_id, input.workerId, claim.endpoint, "rate_limited", result.retryAfterSeconds, false);
    return { claimed: true, outcome: "rate_limited" };
  }
  if (result.kind === "outage") {
    await store.fail(claim.connection_id, input.workerId, claim.endpoint, result.code, result.retryAfterSeconds, true);
    return { claimed: true, outcome: result.code };
  }
  const schema = schemaForEndpoint(claim.endpoint);
  if (!schema || !validateContract(schema, result.body)) {
    await store.fail(claim.connection_id, input.workerId, claim.endpoint, "schema", 3600, false);
    return { claimed: true, outcome: "schema" };
  }
  const body = asRecord(result.body);
  if (!body) {
    await store.fail(claim.connection_id, input.workerId, claim.endpoint, "schema", 3600, false);
    return { claimed: true, outcome: "schema" };
  }
  if (claim.endpoint === "finance/records") {
    const mapped = mapRecordsPage(body as Parameters<typeof mapRecordsPage>[0], claim);
    try {
      await store.commitRecords(claim.connection_id, input.workerId, {
        endpoint: claim.endpoint,
        snapshot_id: body.snapshot_id,
        high_watermark: body.high_watermark,
        query_binding_sha256: body.query_binding_sha256,
        data_as_of: body.data_as_of,
        has_more: (body.page as { has_more: boolean }).has_more,
        next_cursor: (body.page as { next_cursor: string | null }).next_cursor,
        checkpoint: (body.page as { next_sync_checkpoint: string | null }).next_sync_checkpoint,
        records: mapped.records,
        quarantine: mapped.quarantine,
      });
    } catch {
      await store.fail(claim.connection_id, input.workerId, claim.endpoint, "commit_failed", 60, false);
      return { claimed: true, outcome: "commit_failed" };
    }
    return { claimed: true, outcome: mapped.quarantine.length > 0 ? "quarantine" : "committed" };
  }
  try {
    await store.commitSnapshot(claim.connection_id, input.workerId, snapshotPage(claim.endpoint, body));
  } catch {
    await store.fail(claim.connection_id, input.workerId, claim.endpoint, "commit_failed", 60, false);
    return { claimed: true, outcome: "commit_failed" };
  }
  return { claimed: true, outcome: "committed" };
}
