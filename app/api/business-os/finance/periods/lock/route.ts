import { NextRequest, NextResponse } from "next/server";
import { jsonError, mapAuthError } from "@/lib/business-os/auth/http";
import { optionalDate } from "@/lib/business-os/finance/body";
import { MoneyError } from "@/lib/business-os/finance/money";
import { financeRpc } from "@/lib/business-os/finance/rpc";
import { beginFinanceWrite } from "@/lib/business-os/finance/route-guard";

const BASES = new Set(["purchase", "earned_management", "settled_cash", "sms_legacy"]);

export async function POST(request: NextRequest) {
  const profile = await beginFinanceWrite(request);
  if (profile instanceof NextResponse) return profile;
  let body: { periodStart?: unknown; periodEnd?: unknown; basis?: unknown; formulaVersion?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  try {
    const periodStart = optionalDate(body.periodStart);
    const periodEnd = optionalDate(body.periodEnd);
    if (!periodStart || !periodEnd) return jsonError("invalid_body", 400);
    if (typeof body.basis !== "string" || !BASES.has(body.basis)) return jsonError("invalid_body", 400);
    if (typeof body.formulaVersion !== "string") return jsonError("invalid_body", 400);
    return financeRpc("lock_period", {
      actor_id: profile.userId,
      period_start: periodStart,
      period_end: periodEnd,
      basis: body.basis,
      formula_version: body.formulaVersion,
    });
  } catch (error) {
    if (error instanceof MoneyError) return jsonError("invalid_body", 400);
    return mapAuthError(error);
  }
}
