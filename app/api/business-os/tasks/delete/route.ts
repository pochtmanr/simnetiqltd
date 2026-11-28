import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/business-os/auth/http";
import { isUuid } from "@/lib/business-os/finance/body";
import { operationsRpc } from "@/lib/business-os/operations/rpc";
import { beginOperationsWrite } from "@/lib/business-os/operations/route-guard";

export async function POST(request: NextRequest) {
  const profile = await beginOperationsWrite(request);
  if (profile instanceof NextResponse) return profile;
  const body = (await request.json().catch(() => ({}))) as { taskId?: unknown };
  if (!isUuid(body.taskId)) return jsonError("invalid_body", 400);
  return operationsRpc("delete_task", { actor_id: profile.userId, task_id: body.taskId });
}
