import { NextRequest, NextResponse } from "next/server";
import { jsonError, mapAuthError } from "@/lib/business-os/auth/http";
import { financeRpc } from "@/lib/business-os/finance/rpc";
import { beginFinanceRead } from "@/lib/business-os/finance/route-guard";

export async function GET(request: NextRequest) {
  const profile = await beginFinanceRead();
  if (profile instanceof NextResponse) return profile;
  const project = request.nextUrl.searchParams.get("project");
  if (!project) return jsonError("invalid_body", 400);
  try {
    return financeRpc("reconciliation_quality", { actor_id: profile.userId, project_slug: project });
  } catch (error) {
    return mapAuthError(error);
  }
}
