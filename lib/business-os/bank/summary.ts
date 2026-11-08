import { bankCategory } from "@/lib/business-os/bank/categories";

/**
 * Cash-flow figures from bank rows. Pure, so the Bank tab, the statements and
 * (later) the agent's tools all compute them the same way. Only completed rows
 * count. Own-account transfers are reported apart and never inflate money in or
 * out. Sums are exact: decimals are added as integers at 4 places.
 */

export type BankRowLike = { state: string; amount: string; fee: string; currency: string; category: string | null; createdAt: string };

const SCALE = 4;
const FACTOR = BigInt(10 ** SCALE);

export function toUnits(raw: string): bigint {
  const match = /^(-)?(\d+)(?:\.(\d+))?$/.exec(raw.trim());
  if (!match) return BigInt(0);
  const fraction = (match[3] ?? "").slice(0, SCALE).padEnd(SCALE, "0");
  const value = BigInt(match[2]) * FACTOR + BigInt(fraction);
  return match[1] ? -value : value;
}

export function fromUnits(units: bigint, places = 2): string {
  const negative = units < BigInt(0);
  const abs = negative ? -units : units;
  // Round half away from zero to `places`.
  const step = BigInt(10 ** (SCALE - places));
  const rounded = ((abs + step / BigInt(2)) / step) * step;
  const whole = rounded / FACTOR;
  const fraction = (rounded % FACTOR).toString().padStart(SCALE, "0").slice(0, places);
  const text = places > 0 ? `${whole}.${fraction}` : `${whole}`;
  return negative && rounded !== BigInt(0) ? `-${text}` : text;
}

export type CategoryTotal = { category: string | null; label: string; total: string; count: number };

export type CurrencyFlow = {
  currency: string;
  moneyIn: string;
  moneyOut: string;
  net: string;
  fees: string;
  transfers: string;
  inflows: CategoryTotal[];
  outflows: CategoryTotal[];
  uncategorised: number;
};

type Bucket = { units: bigint; count: number };

/** Money in and out per currency for completed rows, broken down by category, busiest currency first. */
export function cashflow(rows: BankRowLike[]): CurrencyFlow[] {
  const byCurrency = new Map<string, { in: Map<string | null, Bucket>; out: Map<string | null, Bucket>; fees: bigint; transfers: bigint; uncategorised: number; rows: number }>();
  for (const row of rows) {
    if (row.state !== "completed") continue;
    let entry = byCurrency.get(row.currency);
    if (!entry) {
      entry = { in: new Map(), out: new Map(), fees: BigInt(0), transfers: BigInt(0), uncategorised: 0, rows: 0 };
      byCurrency.set(row.currency, entry);
    }
    entry.rows += 1;
    const amount = toUnits(row.amount);
    entry.fees += toUnits(row.fee);
    if (bankCategory(row.category)?.flow === "transfer") {
      entry.transfers += amount;
      continue;
    }
    if (!row.category) entry.uncategorised += 1;
    const side = amount >= BigInt(0) ? entry.in : entry.out;
    const bucket = side.get(row.category) ?? { units: BigInt(0), count: 0 };
    bucket.units += amount;
    bucket.count += 1;
    side.set(row.category, bucket);
  }
  const abs = (value: bigint) => (value < BigInt(0) ? -value : value);
  // Largest amount first, either side.
  const list = (side: Map<string | null, Bucket>): CategoryTotal[] =>
    [...side.entries()]
      .sort(([, a], [, b]) => (abs(b.units) > abs(a.units) ? 1 : abs(b.units) < abs(a.units) ? -1 : 0))
      .map(([category, bucket]) => ({ category, label: bankCategory(category)?.label ?? "Uncategorised", total: fromUnits(bucket.units), count: bucket.count }));
  const sum = (side: Map<string | null, Bucket>) => [...side.values()].reduce((total, bucket) => total + bucket.units, BigInt(0));
  // The busiest currency first; ties by code.
  return [...byCurrency.entries()]
    .sort(([a, left], [b, right]) => right.rows - left.rows || a.localeCompare(b))
    .map(([currency, entry]) => {
      const moneyIn = sum(entry.in);
      const moneyOut = sum(entry.out);
      return {
        currency,
        moneyIn: fromUnits(moneyIn),
        moneyOut: fromUnits(moneyOut),
        net: fromUnits(moneyIn + moneyOut),
        fees: fromUnits(entry.fees),
        transfers: fromUnits(entry.transfers),
        inflows: list(entry.in),
        outflows: list(entry.out),
        uncategorised: entry.uncategorised,
      };
    });
}

/** Daily money in and out for one currency, for the trend chart. Days without rows are left out. */
export function dailyFlow(rows: BankRowLike[], currency: string): { day: string; moneyIn: number; moneyOut: number }[] {
  const days = new Map<string, { in: bigint; out: bigint }>();
  for (const row of rows) {
    if (row.state !== "completed" || row.currency !== currency || bankCategory(row.category)?.flow === "transfer") continue;
    const day = row.createdAt.slice(0, 10);
    const entry = days.get(day) ?? { in: BigInt(0), out: BigInt(0) };
    const amount = toUnits(row.amount);
    if (amount >= BigInt(0)) entry.in += amount;
    else entry.out += amount;
    days.set(day, entry);
  }
  return [...days.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, entry]) => ({ day, moneyIn: Number(fromUnits(entry.in)), moneyOut: Number(fromUnits(-entry.out)) }));
}
