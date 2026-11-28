import assert from "node:assert/strict";
import test from "node:test";
import { CHECKLIST, CHECKLIST_TAGS, checklistProgress, checklistRows } from "@/lib/business-os/company/checklist";
import { accountingPeriods, addMonths, companyDeadlines, daysUntil, upcomingDeadlines, type CompanyDates } from "@/lib/business-os/company/deadlines";
import { COMPANY_DATES } from "@/lib/business-os/company/profile";
import { parseTags } from "@/lib/business-os/files/kinds";

test("every checklist tag is unique and a valid file tag", () => {
  assert.equal(new Set(CHECKLIST_TAGS).size, CHECKLIST_TAGS.length);
  for (const tag of CHECKLIST_TAGS) {
    assert.match(tag, /^req-/);
    assert.deepEqual(parseTags([tag]), [tag], tag);
  }
});

test("a row is on file when a file carries its tag; rows that cannot exist yet are not missing", () => {
  const rows = checklistRows({ "req-articles": [{ id: "1", title: "Articles" }] }, "2026-11-28");
  const state = (tag: string) => rows.find((row) => row.tag === tag)?.state;
  assert.equal(state("req-articles"), "on_file");
  assert.equal(state("req-memorandum"), "missing");
  assert.equal(state("req-annual-accounts"), "not_due");
  assert.equal(state("req-insurance"), "optional");
  const required = CHECKLIST.filter((item) => item.level === "required").length;
  assert.deepEqual(checklistProgress(rows), { onFile: 1, required: required - 2, missing: required - 3 });
  // Once the first accounts are due they count.
  assert.equal(checklistRows({}, "2027-08-17").find((row) => row.tag === "req-annual-accounts")?.state, "missing");
});

test("month arithmetic keeps month ends and clamps short months", () => {
  assert.equal(addMonths("2025-11-17", 21), "2027-08-17");
  assert.equal(addMonths("2026-11-30", 9), "2027-08-31");
  assert.equal(addMonths("2027-11-30", 3), "2028-02-29");
  assert.equal(addMonths("2026-01-30", 1), "2026-02-28");
});

test("Simnetiq's dates match the Companies House record", () => {
  assert.deepEqual(accountingPeriods(COMPANY_DATES, 2), [
    { start: "2025-11-17", end: "2026-11-30" },
    { start: "2026-12-01", end: "2027-11-30" },
  ]);
  const due = (id: string) => companyDeadlines(COMPANY_DATES).find((item) => item.id === id)?.due;
  assert.equal(due("confirmation-statement-2026-11-16"), "2026-11-30");
  assert.equal(due("director-identity-verification"), "2026-11-30");
  assert.equal(due("accounts-2026-11-30"), "2027-08-17");
  assert.equal(due("accounts-2027-11-30"), "2028-08-31");
  // The first period is longer than 12 months, so Corporation Tax splits in two.
  assert.equal(due("corporation-tax-2026-11-16"), "2027-08-17");
  // Nine months and one day after a 30 November period end is 1 September.
  assert.equal(due("corporation-tax-2026-11-30"), "2027-09-01");
  assert.equal(due("company-tax-return-2026-11-30"), "2027-11-30");
  assert.equal(due("corporation-tax-2027-11-30"), "2028-09-01");
});

test("VAT returns appear only once the quarter group is known", () => {
  assert.equal(companyDeadlines(COMPANY_DATES).some((item) => item.id.startsWith("vat-return")), false);
  const dates: CompanyDates = { ...COMPANY_DATES, vatStagger: 2 };
  const vat = companyDeadlines(dates).filter((item) => item.id.startsWith("vat-return"));
  assert.equal(vat[0].id, "vat-return-2026-01-31");
  assert.equal(vat[0].due, "2026-03-07");
  assert.deepEqual(vat.slice(1, 4).map((item) => item.due), ["2026-06-07", "2026-09-07", "2026-12-07"]);
});

test("upcoming deadlines keep recently passed ones, soonest first", () => {
  const next = upcomingDeadlines(COMPANY_DATES, "2026-11-28", 3);
  assert.deepEqual(next.map((item) => item.due), ["2026-11-30", "2026-11-30", "2027-08-17"]);
  assert.equal(daysUntil("2026-11-30", "2026-11-28"), 2);
  assert.equal(daysUntil("2026-11-30", "2026-12-05"), -5);
  assert.equal(upcomingDeadlines(COMPANY_DATES, "2027-03-01", 1)[0].due, "2027-08-17");
});
