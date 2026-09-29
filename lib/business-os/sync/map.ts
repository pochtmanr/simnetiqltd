export type SourceRecord = {
  record_id: string;
  revision: number;
  change_sequence: string;
  record_type: string;
  project_id: string;
  environment: string;
  external_object_id: string;
  economic_transaction_id: string;
  occurred_at: string;
  status: "posted" | "pending" | "void";
  original_amount: {
    amount: string | null;
    currency?: string;
    asset?: string;
    network?: string;
    quality: string;
    reason?: string;
  };
  quality: string;
  formula_version: string;
  content_hash: string;
  economic_direction: "inflow" | "outflow" | "transfer";
  counts_as_new_revenue: boolean;
  posting_role?: "primary" | "alias";
  component_id?: string;
  alias_ids?: string[];
  supersedes_revision?: number;
  legacy_net_amount?: { amount: string | null; currency?: string };
  legacy_formula_version?: string;
  source_gbp_valuation?: { amount: string | null; policy_version?: string };
  source_system?: string;
  channel?: string;
  store?: string;
  processor?: string;
  components?: unknown[];
};

export type MappedRecord = Record<string, unknown>;

const ACCOUNTS: Record<string, { debit: string; credit: string } | { inflow: { debit: string; credit: string }; outflow: { debit: string; credit: string } }> = {
  sale: { debit: "clearing-gbp", credit: "revenue-gbp" },
  refund_reversal: { debit: "clearing-gbp", credit: "revenue-gbp" },
  refund: { debit: "revenue-gbp", credit: "clearing-gbp" },
  chargeback: { debit: "revenue-gbp", credit: "clearing-gbp" },
  expense: { debit: "opex-gbp", credit: "clearing-gbp" },
  direct_cost: { debit: "cogs-gbp", credit: "clearing-gbp" },
};

function accounts(record: SourceRecord): { debit: string; credit: string } {
  if (record.record_type === "fee") {
    return record.economic_direction === "inflow"
      ? { debit: "clearing-gbp", credit: "fees-gbp" }
      : { debit: "fees-gbp", credit: "clearing-gbp" };
  }
  if (record.record_type === "settlement") {
    return record.economic_direction === "inflow"
      ? { debit: "bank-gbp", credit: "clearing-gbp" }
      : { debit: "clearing-gbp", credit: "bank-gbp" };
  }
  if (record.record_type === "transfer") return { debit: "wallet-ops-gbp", credit: "wallet-gbp" };
  if (record.record_type === "opening_balance") {
    return record.economic_direction === "outflow"
      ? { debit: "owner-funding-gbp", credit: "bank-gbp" }
      : { debit: "bank-gbp", credit: "owner-funding-gbp" };
  }
  const fixed = ACCOUNTS[record.record_type];
  if (fixed && "debit" in fixed) return fixed;
  return { debit: "clearing-gbp", credit: "revenue-gbp" };
}

export function mapRecord(
  record: SourceRecord,
  connection: { environment: string; recognition_basis: string },
): MappedRecord {
  const legacy = record.legacy_formula_version === "sms-legacy-usd-v1";
  const role = record.posting_role ?? "primary";
  const posting = record.status === "posted" && role === "primary" && !legacy;
  const pair = accounts(record);
  const money = record.original_amount;
  const mapped: MappedRecord = {
    project_slug: record.project_id,
    environment: connection.environment,
    external_object_id: record.external_object_id,
    event_kind: record.record_type,
    external_adjustment_id: "",
    revision: record.revision,
    record_type: record.record_type,
    recognition_basis: legacy ? "sms_legacy" : connection.recognition_basis,
    posting,
    posting_role: role,
    economic_transaction_id: record.economic_transaction_id,
    counts_as_new_revenue: legacy ? false : record.counts_as_new_revenue,
    original_amount: money.amount,
    original_currency: money.currency ?? null,
    asset: money.asset ?? null,
    network: money.network ?? null,
    amount_reason: money.amount === null ? (money.reason ?? null) : null,
    quality: record.quality,
    occurred_at: record.occurred_at,
    formula_version: record.formula_version,
    content_hash: record.content_hash,
    status: record.status,
    record_id: record.record_id,
    change_sequence: record.change_sequence,
    debit_account: pair.debit,
    credit_account: pair.credit,
  };
  if (record.component_id) mapped.component_id = record.component_id;
  if (record.alias_ids) mapped.alias_ids = record.alias_ids;
  if (record.supersedes_revision) mapped.supersedes_revision = record.supersedes_revision;
  if (record.legacy_formula_version) mapped.legacy_formula_version = record.legacy_formula_version;
  if (record.legacy_net_amount?.amount) mapped.legacy_net_amount = record.legacy_net_amount.amount;
  if (record.source_gbp_valuation?.policy_version) mapped.source_policy_version = record.source_gbp_valuation.policy_version;
  if (record.source_gbp_valuation?.amount) mapped.source_gbp_amount = record.source_gbp_valuation.amount;
  if (record.source_system) mapped.source_system = record.source_system;
  if (record.channel) mapped.channel = record.channel;
  if (record.store) mapped.store = record.store;
  if (record.processor) mapped.processor = record.processor;
  if (record.components) mapped.components = record.components;
  return mapped;
}

export function mapRecordsPage(
  body: {
    snapshot_id: string;
    high_watermark: string;
    query_binding_sha256: string;
    data_as_of: string;
    records: SourceRecord[];
    page: { has_more: boolean; next_cursor: string | null; next_sync_checkpoint: string | null };
  },
  connection: { project_slug: string; environment: string; source_environment: string; recognition_basis: string },
): { records: MappedRecord[]; quarantine: { reason: string; record_id: string; revision: number; content_hash: string; detail: string }[] } {
  const records: MappedRecord[] = [];
  const quarantine = [];
  const sorted = [...body.records].sort((left, right) => Number(left.change_sequence) - Number(right.change_sequence));
  for (const record of sorted) {
    if (record.project_id !== connection.project_slug || record.environment !== connection.source_environment) {
      quarantine.push({
        reason: "binding_error",
        record_id: record.record_id,
        revision: record.revision,
        content_hash: record.content_hash,
        detail: record.project_id !== connection.project_slug ? "project_mismatch" : "environment_mismatch",
      });
      continue;
    }
    records.push(mapRecord(record, connection));
  }
  return { records, quarantine };
}

export function snapshotPage(endpoint: string, body: Record<string, unknown>) {
  const period = body.period as { from?: string; to?: string; timezone?: string } | undefined;
  const coverage = body.coverage as { status?: string } | string | undefined;
  const page = body.page as { has_more?: boolean; next_cursor?: string | null } | undefined;
  return {
    endpoint,
    has_more: page?.has_more ?? false,
    next_cursor: page?.next_cursor ?? null,
    grain: typeof body.report === "string" ? body.report : period ? "period" : "snapshot",
    timezone: (typeof body.source_timezone === "string" ? body.source_timezone : null) ?? period?.timezone ?? null,
    coverage: typeof coverage === "string" ? coverage : (coverage?.status ?? null),
    cutoff_from: period?.from ?? null,
    cutoff_to: period?.to ?? null,
    body,
  };
}
