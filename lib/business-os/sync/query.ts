import { londonWindow } from "@/lib/business-os/finance/london";

export type PullClaim = {
  endpoint: string;
  cursor: string | null;
  /** `incremental` once the first full pass has been committed. */
  phase?: string | null;
  /** Where the last full pass of records ended; continues from there. */
  checkpoint?: string | null;
  initial_from: string;
  initial_to: string;
  page_limit: number;
  recognition_basis: string;
  timezone: string;
};

const ANALYTICS = {
  ga4_overview_daily: "ga4",
  ga4_breakdown: "ga4",
  ga4_period_unique_users: "ga4",
  gsc_daily_totals: "gsc",
  gsc_dimension_rows: "gsc",
  vercel_daily: "vercel",
} as const;

export function queryFor(claim: PullClaim, now: Date = new Date()): { path: string; pairs: [string, string][] } {
  // After the backfill, period datasets follow the current London month, which is the window the dashboard reports on.
  const month = claim.phase === "incremental" ? londonWindow("month", now) : null;
  // Sources accept instants without milliseconds only.
  const from = month ? month.from.replace(".000Z", "Z") : claim.initial_from;
  const to = month ? month.to.replace(".000Z", "Z") : claim.initial_to;
  if (claim.endpoint === "capabilities") {
    return { path: "/api/business-os/v1/capabilities", pairs: [] };
  }
  if (claim.endpoint === "finance/records") {
    // No window: a cursor is bound to its query, so a fixed from/to would stop new sales arriving after `initial_to`.
    const pairs: [string, string][] = [["limit", String(claim.page_limit)]];
    const cursor = claim.cursor ?? (claim.phase === "incremental" ? claim.checkpoint : null);
    if (cursor) pairs.push(["cursor", cursor]);
    return { path: "/api/business-os/v1/finance/records", pairs };
  }
  if (claim.endpoint === "finance/balances") {
    return { path: "/api/business-os/v1/finance/balances", pairs: [["as_of", to]] };
  }
  if (claim.endpoint === "subscriptions/summary") {
    return {
      path: "/api/business-os/v1/subscriptions/summary",
      pairs: [
        ["from", from],
        ["to", to],
        ["as_of", to],
      ],
    };
  }
  if (claim.endpoint === "operations/daily") {
    return { path: "/api/business-os/v1/operations/daily", pairs: [["from", from], ["to", to]] };
  }
  if (claim.endpoint.startsWith("analytics/")) {
    const report = claim.endpoint.slice("analytics/".length);
    const provider = ANALYTICS[report as keyof typeof ANALYTICS];
    if (!provider) throw new Error("dataset_invalid");
    const pairs: [string, string][] = [
      ["provider", provider],
      ["report", report],
      ["from", from],
      ["to", to],
    ];
    if (claim.cursor) pairs.push(["cursor", claim.cursor]);
    return { path: "/api/business-os/v1/analytics/report", pairs };
  }
  return {
    path: `/api/business-os/v1/${claim.endpoint}`,
    pairs: [
      ["from", from],
      ["to", to],
      ["timezone", claim.timezone],
      ["currency", "GBP"],
      ["basis", claim.recognition_basis],
    ],
  };
}
