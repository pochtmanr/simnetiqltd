import { NextRequest, NextResponse } from "next/server";
import { jsonError, mapAuthError } from "@/lib/business-os/auth/http";
import { financeRpc } from "@/lib/business-os/finance/rpc";
import { drillQuery } from "@/lib/business-os/finance/reconcile";
import { beginFinanceRead } from "@/lib/business-os/finance/route-guard";

export async function GET(request: NextRequest) {
  const profile = await beginFinanceRead();
  if (profile instanceof NextResponse) return profile;
  const query = drillQuery(request.nextUrl.searchParams);
  if ("error" in query) return jsonError(query.error, 400);
  try {
    return financeRpc("report_drill", { actor_id: profile.userId, payload: query });
  } catch (error) {
    return mapAuthError(error);
  }
}
