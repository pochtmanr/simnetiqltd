import { NextRequest, NextResponse } from "next/server";
import { jsonError, mapAuthError } from "@/lib/business-os/auth/http";
import { financeRpc } from "@/lib/business-os/finance/rpc";
import { reportQuery } from "@/lib/business-os/finance/reconcile";
import { beginFinanceRead } from "@/lib/business-os/finance/route-guard";

export async function GET(request: NextRequest) {
  const profile = await beginFinanceRead();
  if (profile instanceof NextResponse) return profile;
  const query = reportQuery(request.nextUrl.searchParams);
  if ("error" in query) return jsonError(query.error, 400);
  try {
    return financeRpc("financial_report", { actor_id: profile.userId, payload: query });
  } catch (error) {
    return mapAuthError(error);
  }
}
