import "server-only";
import { createSecretClient } from "@/lib/business-os/db/client";
import { DOCUMENTS_BUCKET } from "@/lib/business-os/files/bucket";
import { extractText, mimeFromName } from "@/lib/business-os/files/kinds";
import { verifyStoredUpload } from "@/lib/business-os/files/verify";
import { readFinanceRpc } from "@/lib/business-os/finance/rpc";

type CompleteResult = { ok: true; result: unknown } | { ok: false; error: string; status: number };

export async function completeDocumentUpload(
  actorId: string,
  documentId: string,
  fileName: string | null,
  sha256: string,
): Promise<CompleteResult> {
  const mime = fileName ? mimeFromName(fileName) : null;
  if (!mime) return { ok: false, error: "invalid_body", status: 400 };

  const authorized = await readFinanceRpc("authorize_document", { actor_id: actorId, document_id: documentId });
  if ("error" in authorized) return { ok: false, error: "unavailable", status: 500 };
  const row = authorized.data as { origin?: string; objectPath?: string | null; uploadStatus?: string } | null;
  if (!row?.objectPath || row.origin !== "central") return { ok: false, error: "invalid_body", status: 400 };
  if (row.uploadStatus === "stored") return { ok: true, result: { id: documentId } };

  const storage = createSecretClient().storage.from(DOCUMENTS_BUCKET);
  const download = await storage.download(row.objectPath);
  if (download.error || !download.data) return { ok: false, error: "upload_incomplete", status: 409 };
  const bytes = new Uint8Array(await download.data.arrayBuffer());

  const verified = verifyStoredUpload({ mime, declaredSha256: sha256, bytes });
  if ("fault" in verified) {
    await storage.remove([row.objectPath]);
    await readFinanceRpc("delete_document", { actor_id: actorId, document_id: documentId });
    return { ok: false, error: verified.fault, status: 400 };
  }

  const completed = await readFinanceRpc("complete_upload", {
    actor_id: actorId,
    document_id: documentId,
    checksum: verified.checksum,
    mime_type: mime,
    byte_size: bytes.byteLength,
  });
  if ("error" in completed) return { ok: false, error: "unavailable", status: 500 };

  const extracted = extractText(mime, bytes);
  if (extracted === null) return { ok: true, result: { id: documentId, indexed: false } };

  const stored = await readFinanceRpc("store_document_text", {
    actor_id: actorId,
    document_id: documentId,
    extracted_text: extracted,
    summary: null,
  });
  return { ok: true, result: { id: documentId, indexed: !("error" in stored) } };
}
