import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/business-os/auth/http";
import { isUuid } from "@/lib/business-os/finance/body";
import { financeRpc } from "@/lib/business-os/finance/rpc";
import { beginFinanceWrite } from "@/lib/business-os/finance/route-guard";

export async function POST(request: NextRequest) {
  const profile = await beginFinanceWrite(request);
  if (profile instanceof NextResponse) return profile;
  let body: { entryId?: unknown; reason?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  if (!isUuid(body.entryId) || typeof body.reason !== "string" || body.reason.trim().length === 0) {
    return jsonError("invalid_body", 400);
  }
  return financeRpc("reverse_entry", {
    actor_id: profile.userId,
    target_entry: body.entryId,
    reason: body.reason,
  });
}
