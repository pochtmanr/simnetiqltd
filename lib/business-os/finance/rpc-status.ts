const FORBIDDEN = ["reader_forbidden", "source_expense_readonly"];
const CONFLICT = [
  "duplicate_origin",
  "duplicate_fee_component",
  "duplicate_economic",
  "already_reversed",
  "period_locked",
  "posted_line_immutable",
  "observation_immutable",
  "synthetic_evidence",
  "parity_incomplete",
];
const UNPROCESSABLE = ["basis_invalid", "interval_too_large", "grain_invalid", "live_evidence_unavailable"];
const INVALID = [
  "amount_invalid",
  "amount_scale",
  "amount_required",
  "amount_reason_required",
  "amount_zero",
  "currency_unsupported",
  "currency_conflict",
  "currency_required",
  "currency_invalid",
  "summary_non_posting",
  "not_revenue",
  "unbalanced",
  "allocation_invalid",
  "allocation_exceeds",
  "project_missing",
  "account_missing",
  "dataset_missing",
  "rate_invalid",
  "receipt_invalid",
  "period_invalid",
  "reason_required",
  "hash_invalid",
  "formula_invalid",
  "inconsistent_record",
  "gate_missing",
  "observation_missing",
  "entry_missing",
  "not_draft",
  "expense_not_posted",
  "category_invalid",
  "date_invalid",
  "workflow_invalid",
  "replacement_invalid",
];

const RPC_CODES = [...FORBIDDEN, ...UNPROCESSABLE, ...CONFLICT, ...INVALID];

export function financeRpcCode(message: string): string {
  return RPC_CODES.find((code) => message.includes(code)) ?? "unavailable";
}

export function financeRpcStatus(message: string): number | null {
  if (FORBIDDEN.some((code) => message.includes(code))) return 403;
  if (UNPROCESSABLE.some((code) => message.includes(code))) return 422;
  if (CONFLICT.some((code) => message.includes(code))) return 409;
  if (INVALID.some((code) => message.includes(code))) return 400;
  return null;
}
