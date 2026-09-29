import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCESS_COOKIE } from "@/lib/business-os/auth/cookies";
import { jsonError } from "@/lib/business-os/auth/http";
import { createUserClient } from "@/lib/business-os/db/client";
import { csvScopeFromReport, formatFinanceCsv, instantInWindow, type CsvRow } from "@/lib/business-os/finance/csv";
import { londonDate } from "@/lib/business-os/finance/london";
import { reportQuery } from "@/lib/business-os/finance/reconcile";
import { financeRpc } from "@/lib/business-os/finance/rpc";
import { beginFinanceRead } from "@/lib/business-os/finance/route-guard";

type LineRecord = {
  side: unknown;
  original_amount: unknown;
  original_currency: unknown;
  gbp_amount: unknown;
  projects: { slug?: unknown } | { slug?: unknown }[] | null;
  financial_accounts: { code?: unknown } | { code?: unknown }[] | null;
  financial_entries: { effective_at?: unknown; status?: unknown } | { effective_at?: unknown; status?: unknown }[] | null;
};

function one<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function text(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export async function GET(request: NextRequest) {
  const profile = await beginFinanceRead();
  if (profile instanceof NextResponse) return profile;
  const parsed = reportQuery(request.nextUrl.searchParams);
  const from = "from" in parsed ? parsed.from : null;
  const to = "to" in parsed ? parsed.to : null;
  const basis = "basis" in parsed ? parsed.basis : null;
  const grain = "grain" in parsed ? parsed.grain : null;
  if (!from || !to || !basis || !grain) return jsonError("invalid_body", 400);
  const reportResponse = await financeRpc("financial_report", {
    actor_id: profile.userId,
    payload: {
      project_slug: "project_slug" in parsed && typeof parsed.project_slug === "string" ? parsed.project_slug : null,
      from,
      to,
      basis,
      grain,
    },
  });
  if (reportResponse.status !== 200) return reportResponse;
  const reportPayload = (await reportResponse.json()) as { result?: unknown };
  const scope = csvScopeFromReport(reportPayload.result);
  if (!scope) return jsonError("unavailable", 500);
  const project = "project_slug" in parsed && typeof parsed.project_slug === "string" ? parsed.project_slug : null;
  const currency = request.nextUrl.searchParams.get("currency");
  const access = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!access) return jsonError("unauthenticated", 401);
  const selected = await createUserClient(access)
    .schema("business_os")
    .from("financial_lines")
    .select("side, original_amount, original_currency, gbp_amount, projects(slug), financial_accounts(code), financial_entries(effective_at, status)");
  if (selected.error || !selected.data) return jsonError("unavailable", 500);
  const rows: CsvRow[] = [];
  for (const record of selected.data as LineRecord[]) {
    const entry = one(record.financial_entries);
    if (entry?.status !== "posted") continue;
    const effectiveInstant = text(entry.effective_at);
    if (!effectiveInstant || !instantInWindow(effectiveInstant, from, to)) continue;
    const lineProject = text(one(record.projects)?.slug);
    if (project && lineProject !== project) continue;
    const original = text(record.original_amount);
    const originalCurrency = text(record.original_currency);
    if (currency && originalCurrency !== currency) continue;
    const account = text(one(record.financial_accounts)?.code);
    if (!original || !originalCurrency || !account || (record.side !== "debit" && record.side !== "credit")) {
      return jsonError("unavailable", 500);
    }
    const gbp = record.gbp_amount === null ? null : text(record.gbp_amount);
    if (record.gbp_amount !== null && gbp === null) return jsonError("unavailable", 500);
    rows.push({
      account,
      side: record.side,
      originalAmount: original,
      originalCurrency,
      gbpAmount: gbp,
      effectiveAt: londonDate(new Date(effectiveInstant)),
    });
  }
  const body = formatFinanceCsv({ basis: scope.basis, coverage: scope.coverage, rows });
  return new NextResponse(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=\"finance.csv\"",
      "cache-control": "private, no-store",
    },
  });
}
