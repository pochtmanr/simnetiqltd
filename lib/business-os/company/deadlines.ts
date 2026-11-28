/**
 * Statutory filing dates for a UK private company, computed from its
 * incorporation date and accounting year end. Pure date arithmetic on ISO
 * dates (YYYY-MM-DD); nothing here knows whether a filing was made.
 */

export type CompanyDates = {
  incorporatedOn: string;
  /** Accounting reference date, month 1-12 and day. */
  yearEnd: { month: number; day: number };
  /** HMRC VAT stagger: 1 = quarters ending Mar/Jun/Sep/Dec, 2 = Apr/Jul/Oct/Jan, 3 = May/Aug/Nov/Feb. Null when not known. */
  vatStagger: 1 | 2 | 3 | null;
  /** One-off dated duties, such as the director's identity verification. */
  oneOff: { id: string; title: string; due: string; detail: string }[];
};

export type Deadline = { id: string; title: string; due: string; detail: string };

function parts(iso: string): [number, number, number] {
  const [year, month, day] = iso.split("-").map(Number);
  return [year, month, day];
}

function iso(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

function lastDay(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = parts(date);
  return iso(year, month, day + days);
}

/** Same day `months` later; a month end stays a month end and an overflowing day is clamped. */
export function addMonths(date: string, months: number): string {
  const [year, month, day] = parts(date);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const y = target.getUTCFullYear();
  const m = target.getUTCMonth() + 1;
  const end = lastDay(y, m);
  return iso(y, m, day === lastDay(year, month) ? end : Math.min(day, end));
}

/** Accounting periods: the first runs from incorporation to the first year end more than six months later; then yearly. */
export function accountingPeriods(dates: CompanyDates, count: number): { start: string; end: string }[] {
  const [year] = parts(dates.incorporatedOn);
  const yearEndIn = (y: number) => iso(y, dates.yearEnd.month, Math.min(dates.yearEnd.day, lastDay(y, dates.yearEnd.month)));
  let end = yearEndIn(year);
  while (end < addMonths(dates.incorporatedOn, 6)) end = yearEndIn(parts(end)[0] + 1);
  const periods = [{ start: dates.incorporatedOn, end }];
  while (periods.length < count) {
    const previous = periods[periods.length - 1].end;
    periods.push({ start: addDays(previous, 1), end: yearEndIn(parts(previous)[0] + 1) });
  }
  return periods;
}

function long(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** Every deadline over the company's first `years` accounting periods, oldest first. */
export function companyDeadlines(dates: CompanyDates, years = 6): Deadline[] {
  const out: Deadline[] = dates.oneOff.map((item) => ({ ...item }));

  // Confirmation statement: made up to the day before each anniversary, due 14 days later.
  for (let n = 1; n <= years; n += 1) {
    const statement = addDays(addMonths(dates.incorporatedOn, 12 * n), -1);
    out.push({
      id: `confirmation-statement-${statement}`,
      title: "Confirmation statement",
      due: addDays(statement, 14),
      detail: `Made up to ${long(statement)}. File with Companies House.`,
    });
  }

  accountingPeriods(dates, years).forEach((period, index) => {
    // First accounts: 21 months after incorporation. Later ones: 9 months after the year end.
    const accountsDue = index === 0 ? addMonths(dates.incorporatedOn, 21) : addMonths(period.end, 9);
    out.push({
      id: `accounts-${period.end}`,
      title: "Annual accounts",
      due: accountsDue,
      detail: `For the period ending ${long(period.end)}. File with Companies House.`,
    });

    // A Corporation Tax period cannot exceed 12 months, so a long first period splits in two.
    const split = addDays(addMonths(period.start, 12), -1);
    const taxPeriods = split < period.end ? [{ start: period.start, end: split }, { start: addDays(split, 1), end: period.end }] : [period];
    for (const tax of taxPeriods) {
      out.push({
        id: `corporation-tax-${tax.end}`,
        title: "Corporation Tax payment",
        due: addDays(addMonths(tax.end, 9), 1),
        detail: `For ${long(tax.start)} to ${long(tax.end)}. Pay HMRC, or tell them nothing is due.`,
      });
    }
    out.push({
      id: `company-tax-return-${period.end}`,
      title: "Company Tax Return",
      due: addMonths(period.end, 12),
      detail: `CT600 for the period ending ${long(period.end)}${taxPeriods.length > 1 ? " (two returns, one per tax period)" : ""}. File with HMRC.`,
    });
  });

  if (dates.vatStagger) {
    const [startYear] = parts(dates.incorporatedOn);
    for (let year = startYear; year <= startYear + years; year += 1) {
      for (let quarter = 0; quarter < 4; quarter += 1) {
        const month = ((dates.vatStagger + 1 + quarter * 3) % 12) + 1;
        const end = iso(year, month, lastDay(year, month));
        if (end < dates.incorporatedOn) continue;
        out.push({
          id: `vat-return-${end}`,
          title: "VAT return and payment",
          due: addDays(addMonths(end, 1), 7),
          detail: `For the quarter ending ${long(end)}. Submit through Making Tax Digital software.`,
        });
      }
    }
  }

  return out.sort((a, b) => a.due.localeCompare(b.due) || a.id.localeCompare(b.id));
}

/** How long a passed deadline stays listed, since nothing here records that it was filed. */
export const OVERDUE_WINDOW_DAYS = 60;

/** Deadlines from 60 days back onward, soonest first. */
export function upcomingDeadlines(dates: CompanyDates, today: string, limit: number): Deadline[] {
  const from = addDays(today, -OVERDUE_WINDOW_DAYS);
  return companyDeadlines(dates)
    .filter((item) => item.due >= from)
    .slice(0, limit);
}

export function daysUntil(due: string, today: string): number {
  return Math.round((Date.parse(`${due}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}
