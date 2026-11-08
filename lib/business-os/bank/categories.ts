/**
 * Bank categories. A slug is stored on each transaction; this list gives it a
 * label and a side of the cash-flow statement. Slugs outside the list are still
 * valid in the database and show as "Other" until added here.
 */

export type BankCategory = { slug: string; label: string; flow: "in" | "out" | "transfer" };

export const BANK_CATEGORIES: BankCategory[] = [
  { slug: "store_payouts", label: "Store payouts", flow: "in" },
  { slug: "processor_payouts", label: "Payment processor payouts", flow: "in" },
  { slug: "other_income", label: "Other income", flow: "in" },
  { slug: "hosting", label: "Hosting & servers", flow: "out" },
  { slug: "software", label: "Software & SaaS", flow: "out" },
  { slug: "stores", label: "App store fees", flow: "out" },
  { slug: "suppliers", label: "Suppliers", flow: "out" },
  { slug: "advertising", label: "Advertising", flow: "out" },
  { slug: "contractors", label: "Contractors", flow: "out" },
  { slug: "salaries", label: "Salaries", flow: "out" },
  { slug: "taxes", label: "Taxes", flow: "out" },
  { slug: "bank_fees", label: "Bank fees", flow: "out" },
  { slug: "office", label: "Office & admin", flow: "out" },
  { slug: "other_costs", label: "Other costs", flow: "out" },
  { slug: "internal_transfer", label: "Own-account transfer", flow: "transfer" },
];

const BY_SLUG = new Map(BANK_CATEGORIES.map((item) => [item.slug, item]));

export const CATEGORY_SLUG = /^[a-z][a-z0-9_]{1,40}$/;

export function bankCategory(slug: string | null): BankCategory | null {
  if (!slug) return null;
  return BY_SLUG.get(slug) ?? { slug, label: slug.replaceAll("_", " "), flow: "out" };
}
