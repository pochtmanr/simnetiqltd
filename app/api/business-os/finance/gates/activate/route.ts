import { NextRequest, NextResponse } from "next/server";
import { jsonError, mapAuthError } from "@/lib/business-os/auth/http";
import { isUuid } from "@/lib/business-os/finance/body";
import { financeRpc } from "@/lib/business-os/finance/rpc";
import { beginFinanceWrite } from "@/lib/business-os/finance/route-guard";

export async function POST(request: NextRequest) {
  const profile = await beginFinanceWrite(request);
  if (profile instanceof NextResponse) return profile;
  let body: { runId?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  if (!isUuid(body.runId)) return jsonError("invalid_body", 400);
  try {
    return financeRpc("activate_dataset_gate", { actor_id: profile.userId, run_id: body.runId });
  } catch (error) {
    return mapAuthError(error);
  }
}
