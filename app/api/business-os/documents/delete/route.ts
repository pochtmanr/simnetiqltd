import { NextRequest, NextResponse } from "next/server";
import { jsonError, mapRpcError } from "@/lib/business-os/auth/http";
import { createSecretClient } from "@/lib/business-os/db/client";
import { isUuid } from "@/lib/business-os/finance/body";
import { readFinanceRpc } from "@/lib/business-os/finance/rpc";
import { DOCUMENTS_BUCKET } from "@/lib/business-os/files/bucket";
import { beginOperationsWrite } from "@/lib/business-os/operations/route-guard";

/** Delete a file that is not attached to an expense, registration or event. */
export async function POST(request: NextRequest) {
  const profile = await beginOperationsWrite(request, "files");
  if (profile instanceof NextResponse) return profile;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  if (!isUuid(body.documentId)) return jsonError("invalid_body", 400);
  const deleted = await readFinanceRpc("delete_document", { actor_id: profile.userId, document_id: body.documentId });
  if ("error" in deleted) {
    if (deleted.error.message?.includes("document_linked")) return jsonError("document_linked", 409);
    return mapRpcError(deleted.error) ?? jsonError("unavailable", 500);
  }
  const objectPath = (deleted.data as { objectPath?: string | null } | null)?.objectPath;
  // The record is gone either way. If Storage refuses, the bytes stay unreferenced and the response says so.
  const removed = objectPath ? await createSecretClient().storage.from(DOCUMENTS_BUCKET).remove([objectPath]) : null;
  return NextResponse.json({ result: { id: body.documentId, bytesRemoved: removed ? !removed.error : true } });
}
