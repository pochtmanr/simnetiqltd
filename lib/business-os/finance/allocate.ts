import { MoneyError, formatMinor, minorUnits } from "@/lib/business-os/finance/money";

/** Split a total across positive weights so the shares sum back to the total. */
export function splitExact(total: string, weights: readonly bigint[], scale: number): string[] {
  if (weights.length === 0 || weights.some((weight) => weight <= 0n)) throw new MoneyError("allocation_invalid");
  const totalMinor = minorUnits(total, scale);
  if (totalMinor < 0n) throw new MoneyError("amount_invalid");
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0n);
  const bases = weights.map((weight) => (totalMinor * weight) / weightSum);
  let remainder = totalMinor - bases.reduce((sum, share) => sum + share, 0n);
  const ranked = weights
    .map((weight, index) => ({ index, fraction: (totalMinor * weight) % weightSum }))
    .sort((left, right) => {
      if (left.fraction === right.fraction) return left.index - right.index;
      return left.fraction > right.fraction ? -1 : 1;
    });
  const shares = [...bases];
  for (const row of ranked) {
    if (remainder === 0n) break;
    shares[row.index] += 1n;
    remainder -= 1n;
  }
  return shares.map((share) => formatMinor(share, scale));
}
