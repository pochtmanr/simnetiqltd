import { MoneyError, assertDecimal } from "@/lib/business-os/finance/money";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

export function optionalDate(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !DATE.test(value)) throw new MoneyError("date_invalid");
  return value;
}

export function moneyField(
  value: unknown,
  input: { currency?: string | null; asset?: string | null; network?: string | null },
): string {
  if (typeof value !== "string") throw new MoneyError("amount_invalid");
  assertDecimal(value, input);
  return value;
}
