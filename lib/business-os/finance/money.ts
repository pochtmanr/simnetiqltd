import exponentsFile from "@/contracts/business-os/v1/currency-exponents.json";

const DECIMAL = /^(0|[1-9][0-9]*)(\.[0-9]{1,18})?$/;
const exponents = exponentsFile.exponents as Record<string, number>;

export class MoneyError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export function fiatScale(currency: string): number | null {
  return Object.prototype.hasOwnProperty.call(exponents, currency) ? exponents[currency] : null;
}

export function assertDecimal(
  raw: string,
  input: { currency?: string | null; asset?: string | null; network?: string | null },
): void {
  if (!DECIMAL.test(raw)) throw new MoneyError("amount_invalid");
  const currency = input.currency ?? null;
  const asset = input.asset ?? null;
  const network = input.network ?? null;
  if (currency && (asset || network)) throw new MoneyError("currency_conflict");
  if (!currency && (!asset || !network)) throw new MoneyError("currency_required");
  const scale = asset ? 18 : fiatScale(currency as string);
  if (scale === null) throw new MoneyError("currency_unsupported");
  const fraction = raw.split(".")[1] ?? "";
  if (fraction.length > scale) throw new MoneyError("amount_scale");
}

export function compareDecimal(left: string, right: string): number {
  assertDecimal(unsignedDecimal(left), { currency: "GBP" });
  assertDecimal(unsignedDecimal(right), { currency: "GBP" });
  const scale = Math.max(fractionLength(left), fractionLength(right));
  const a = minorUnits(left, scale);
  const b = minorUnits(right, scale);
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function minorUnits(raw: string, scale: number): bigint {
  const negative = raw.startsWith("-");
  const value = negative ? raw.slice(1) : raw;
  const [whole, fraction = ""] = value.split(".");
  const padded = `${whole}${fraction.padEnd(scale, "0").slice(0, scale)}`;
  const minor = BigInt(padded === "" ? "0" : padded);
  return negative ? -minor : minor;
}

export function formatMinor(minor: bigint, scale: number): string {
  const negative = minor < 0n;
  const digits = (negative ? -minor : minor).toString().padStart(scale + 1, "0");
  const whole = digits.slice(0, digits.length - scale);
  const fraction = scale === 0 ? "" : digits.slice(digits.length - scale).replace(/0+$/, "");
  const rendered = fraction.length > 0 ? `${whole}.${fraction}` : whole;
  return negative ? `-${rendered}` : rendered;
}

function fractionLength(raw: string): number {
  return raw.split(".")[1]?.length ?? 0;
}

function unsignedDecimal(raw: string): string {
  return raw.startsWith("-") ? raw.slice(1) : raw;
}
