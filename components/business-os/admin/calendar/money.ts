import type { CalendarItem } from "@/lib/business-os/calendar/types";

/**
 * Per-currency sums of decimal strings. Amounts are held as integer
 * ten-thousandths so ledger strings add exactly; currencies never mix.
 */
export type Totals = Map<string, bigint>;

const SCALE = 10_000n;

function toUnits(amount: string): bigint | null {
  const match = /^(-)?(\d+)(?:\.(\d{1,4}))?$/.exec(amount.trim());
  if (!match) return null;
  const units = BigInt(match[2]) * SCALE + BigInt((match[3] ?? "").padEnd(4, "0"));
  return match[1] ? -units : units;
}

export function addTo(totals: Totals, currency: string | null, amount: string | null, sign: 1 | -1 = 1): void {
  if (amount === null) return;
  const units = toUnits(amount);
  if (units === null) return;
  const code = currency ?? "";
  totals.set(code, (totals.get(code) ?? 0n) + (sign < 0 ? -units : units));
}

/** Signed by direction: income is positive, outgoings negative. */
export function addSigned(totals: Totals, item: CalendarItem): void {
  if (!item.direction) return;
  addTo(totals, item.currency, item.amount, item.direction === "in" ? 1 : -1);
}

export function totalsOf(items: CalendarItem[], signed = false): Totals {
  const totals: Totals = new Map();
  for (const item of items) {
    if (signed) addSigned(totals, item);
    else addTo(totals, item.currency, item.amount);
  }
  return totals;
}

/** Currencies in a stable order: GBP first, then alphabetical. */
export function entries(totals: Totals): [string, bigint][] {
  return [...totals.entries()].sort(([a], [b]) => (a === "GBP" ? -1 : b === "GBP" ? 1 : a.localeCompare(b)));
}

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(currency: string, compact: boolean): Intl.NumberFormat | null {
  const key = `${currency}|${compact}`;
  const cached = formatters.get(key);
  if (cached) return cached;
  try {
    const made = new Intl.NumberFormat("en-GB", {
      style: currency ? "currency" : "decimal",
      currency: currency || undefined,
      currencyDisplay: "narrowSymbol",
      notation: compact ? "compact" : "standard",
      minimumFractionDigits: compact ? 0 : 2,
      maximumFractionDigits: compact ? 1 : 2,
      signDisplay: "auto",
    });
    formatters.set(key, made);
    return made;
  } catch {
    return null;
  }
}

/** "£1,240.00", "−$3.00"; `signed` adds a + to positives. Unknown codes fall back to "12.00 XYZ". */
export function formatUnits(units: bigint, currency: string, { compact = false, signed = false } = {}): string {
  const value = Number(units) / Number(SCALE);
  const made = formatter(currency, compact);
  const body = made ? made.format(Math.abs(value)) : `${Math.abs(value).toFixed(2)} ${currency}`;
  const sign = value < 0 ? "−" : signed && value > 0 ? "+" : "";
  return `${sign}${body}`;
}

export function formatAmount(amount: string | null, currency: string | null, direction: CalendarItem["direction"] = null): string | null {
  if (amount === null) return null;
  const units = toUnits(amount);
  if (units === null) return amount;
  return formatUnits(direction === "out" ? -units : units, currency ?? "", { signed: direction === "in" });
}
