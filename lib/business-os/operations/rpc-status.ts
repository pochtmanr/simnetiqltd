const INVALID = [
  "notes_rejected",
  "mime_invalid",
  "document_too_large",
  "checksum_invalid",
  "title_invalid",
  "tag_invalid",
  "public_link_rejected",
  "upload_incomplete",
  "schedule_invalid",
  "date_invalid",
  "project_missing",
  "amount_invalid",
  "amount_scale",
  "currency_invalid",
  "currency_unsupported",
];

export function operationsRpcStatus(message: string): number | null {
  if (message.includes("document_missing") || message.includes("expense_missing") || message.includes("recipient_unlinked")) return 403;
  if (message.includes("source_not_expense") || message.includes("source_expense_readonly") || message.includes("reader_forbidden")) return 403;
  if (INVALID.some((code) => message.includes(code))) return 400;
  return null;
}
