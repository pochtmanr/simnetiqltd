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
  "folder_invalid",
  "query_invalid",
  "document_linked",
  "source_read_only",
  "calendar_title_invalid",
  "calendar_notes_invalid",
  "calendar_category_invalid",
  "calendar_dates_invalid",
  "calendar_time_invalid",
  "calendar_money_invalid",
  "calendar_recurrence_invalid",
  "calendar_status_invalid",
  "calendar_link_invalid",
  "calendar_event_not_found",
];

export function operationsRpcStatus(message: string): number | null {
  if (message.includes("document_missing") || message.includes("expense_missing") || message.includes("recipient_unlinked")) return 403;
  if (message.includes("source_not_expense") || message.includes("source_expense_readonly") || message.includes("reader_forbidden")) return 403;
  if (INVALID.some((code) => message.includes(code))) return 400;
  return null;
}
