import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/business-os/auth/http";
import { isUuid } from "@/lib/business-os/finance/body";
import { financeRpc } from "@/lib/business-os/finance/rpc";
import { beginFinanceWrite } from "@/lib/business-os/finance/route-guard";

export async function POST(request: NextRequest) {
  const profile = await beginFinanceWrite(request);
  if (profile instanceof NextResponse) return profile;
  let body: { lockId?: unknown; reason?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  if (!isUuid(body.lockId) || typeof body.reason !== "string" || body.reason.trim().length === 0) {
    return jsonError("invalid_body", 400);
  }
  return financeRpc("reopen_period", { actor_id: profile.userId, lock_id: body.lockId, reason: body.reason });
}
