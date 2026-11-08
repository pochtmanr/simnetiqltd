import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/business-os/auth/http";
import { createSecretClient } from "@/lib/business-os/db/client";
import { isUuid } from "@/lib/business-os/finance/body";
import { readFinanceRpc } from "@/lib/business-os/finance/rpc";
import { DOCUMENTS_BUCKET } from "@/lib/business-os/files/bucket";
import { extractText, mimeFromName } from "@/lib/business-os/files/kinds";
import { verifyStoredUpload } from "@/lib/business-os/files/verify";
import { operationsData } from "@/lib/business-os/operations/rpc";
import { beginOperationsWrite } from "@/lib/business-os/operations/route-guard";

/**
 * Step 2 of an upload: read the stored object back, verify size, checksum and
 * type, then mark the document stored and index text files. A file that fails
 * verification is removed together with its pending record.
 */
export async function POST(request: NextRequest) {
  const profile = await beginOperationsWrite(request, "files");
  if (profile instanceof NextResponse) return profile;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  const mime = typeof body.fileName === "string" ? mimeFromName(body.fileName) : null;
  if (!isUuid(body.documentId) || !mime || typeof body.sha256 !== "string") return jsonError("invalid_body", 400);
  const documentId = body.documentId;

  const authorized = await operationsData("authorize_document", { actor_id: profile.userId, document_id: documentId });
  if (authorized instanceof NextResponse) return authorized;
  const row = authorized as { origin?: string; objectPath?: string | null; uploadStatus?: string } | null;
  if (!row?.objectPath || row.origin !== "central") return jsonError("invalid_body", 400);
  if (row.uploadStatus === "stored") return NextResponse.json({ result: { id: documentId } });

  const storage = createSecretClient().storage.from(DOCUMENTS_BUCKET);
  const download = await storage.download(row.objectPath);
  if (download.error || !download.data) return jsonError("upload_incomplete", 409);
  const bytes = new Uint8Array(await download.data.arrayBuffer());

  const verified = verifyStoredUpload({ mime, declaredSha256: body.sha256, bytes });
  if ("fault" in verified) {
    await storage.remove([row.objectPath]);
    await readFinanceRpc("delete_document", { actor_id: profile.userId, document_id: documentId });
    return jsonError(verified.fault, 400);
  }

  const completed = await operationsData("complete_upload", {
    actor_id: profile.userId,
    document_id: documentId,
    checksum: verified.checksum,
    mime_type: mime,
    byte_size: bytes.byteLength,
  });
  if (completed instanceof NextResponse) return completed;

  const text = extractText(mime, bytes);
  let indexed = false;
  if (text !== null) {
    const stored = await readFinanceRpc("store_document_text", {
      actor_id: profile.userId,
      document_id: documentId,
      extracted_text: text,
      summary: null,
    });
    indexed = !("error" in stored);
  }
  return NextResponse.json({ result: { id: documentId, indexed } });
}
