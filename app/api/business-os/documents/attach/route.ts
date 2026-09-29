import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/business-os/auth/http";
import { isUuid } from "@/lib/business-os/finance/body";
import { operationsRpc } from "@/lib/business-os/operations/rpc";
import { beginOperationsWrite } from "@/lib/business-os/operations/route-guard";

export async function POST(request: NextRequest) {
  const profile = await beginOperationsWrite(request);
  if (profile instanceof NextResponse) return profile;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  if (!isUuid(body.documentId) || !isUuid(body.expenseId)) return jsonError("invalid_body", 400);
  return operationsRpc("attach_document", {
    actor_id: profile.userId,
    document_id: body.documentId,
    expense_id: body.expenseId,
  });
}
