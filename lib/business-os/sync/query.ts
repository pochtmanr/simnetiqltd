export type PullClaim = {
  endpoint: string;
  cursor: string | null;
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

export function queryFor(claim: PullClaim): { path: string; pairs: [string, string][] } {
  const from = claim.initial_from;
  const to = claim.initial_to;
  if (claim.endpoint === "capabilities") {
    return { path: "/api/business-os/v1/capabilities", pairs: [] };
  }
  if (claim.endpoint === "finance/records") {
    const pairs: [string, string][] = [
      ["from", from],
      ["to", to],
      ["limit", String(claim.page_limit)],
    ];
    if (claim.cursor) pairs.push(["cursor", claim.cursor]);
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
