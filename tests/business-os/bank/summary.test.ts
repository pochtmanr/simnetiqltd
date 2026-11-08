import assert from "node:assert/strict";
import test from "node:test";
import { cashflow, dailyFlow, fromUnits, toUnits, type BankRowLike } from "@/lib/business-os/bank/summary";

const row = (amount: string, category: string | null, extra: Partial<BankRowLike> = {}): BankRowLike => ({
  state: "completed",
  amount,
  fee: "0",
  currency: "GBP",
  category,
  createdAt: "2026-11-01T10:00:00Z",
  ...extra,
});

test("decimal units are exact and round half away from zero", () => {
  assert.equal(fromUnits(toUnits("0.1") + toUnits("0.2")), "0.30");
  assert.equal(fromUnits(toUnits("-42.505")), "-42.51");
  assert.equal(fromUnits(toUnits("-0.001")), "0.00");
  assert.equal(fromUnits(toUnits("1520.4")), "1520.40");
  assert.equal(toUnits("garbage"), BigInt(0));
});

test("cash flow counts completed rows, splits by category, and keeps transfers apart", () => {
  const flows = cashflow([
    row("310.00", "store_payouts"),
    row("120.55", "store_payouts"),
    row("-42.50", "hosting", { fee: "0.30" }),
    row("-19.99", "software"),
    row("-5.00", null),
    row("-100.00", "internal_transfer"),
    row("-999.00", "hosting", { state: "pending" }),
    row("-7.00", "hosting", { state: "declined" }),
    row("115.20", "internal_transfer", { currency: "EUR" }),
  ]);
  assert.equal(flows.length, 2);
  const [gbp, eur] = flows;
  assert.deepEqual([eur.currency, eur.moneyIn, eur.moneyOut, eur.transfers], ["EUR", "0.00", "0.00", "115.20"]);
  assert.deepEqual([gbp.moneyIn, gbp.moneyOut, gbp.net, gbp.fees, gbp.transfers, gbp.uncategorised], ["430.55", "-67.49", "363.06", "0.30", "-100.00", 1]);
  assert.deepEqual(gbp.inflows, [{ category: "store_payouts", label: "Store payouts", total: "430.55", count: 2 }]);
  assert.deepEqual(
    gbp.outflows.map((item) => [item.label, item.total]),
    [
      ["Hosting & servers", "-42.50"],
      ["Software & SaaS", "-19.99"],
      ["Uncategorised", "-5.00"],
    ],
  );
});

test("daily flow sums per day for one currency, money out as a positive figure", () => {
  const days = dailyFlow(
    [
      row("10", "store_payouts", { createdAt: "2026-11-02T08:00:00Z" }),
      row("-4", "hosting", { createdAt: "2026-11-02T09:00:00Z" }),
      row("-6", "hosting", { createdAt: "2026-11-01T09:00:00Z" }),
      row("-50", "internal_transfer", { createdAt: "2026-11-01T09:00:00Z" }),
      row("-1", "hosting", { currency: "EUR" }),
    ],
    "GBP",
  );
  assert.deepEqual(days, [
    { day: "2026-11-01", moneyIn: 0, moneyOut: 6 },
    { day: "2026-11-02", moneyIn: 10, moneyOut: 4 },
  ]);
});
