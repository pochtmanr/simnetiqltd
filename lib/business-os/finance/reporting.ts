import { compareDecimal, formatMinor, minorUnits } from "@/lib/business-os/finance/money";

export type ProfitInput = {
  operating: string | null;
  otherIncome: string | null;
  financing: string | null;
  tax: string | null;
  complete: boolean;
};

export function netProfit(input: ProfitInput): string | null {
  if (!input.complete) return null;
  if (input.operating === null || input.otherIncome === null || input.financing === null || input.tax === null) {
    return null;
  }
  const scale = 2;
  const total =
    minorUnits(input.operating, scale) +
    minorUnits(input.otherIncome, scale) -
    minorUnits(input.financing, scale) -
    minorUnits(input.tax, scale);
  return formatMinor(total, scale);
}

export function marginRatio(profit: string | null, netSales: string | null): string | null {
  if (profit === null || netSales === null) return null;
  if (compareDecimal(netSales, "0") <= 0) return null;
  const scale = 4;
  const sales = minorUnits(netSales, 2);
  const numerator = minorUnits(profit, 2) * 10n ** BigInt(scale);
  return formatMinor(numerator / sales, scale);
}
