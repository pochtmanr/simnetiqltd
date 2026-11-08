import { sha256Hex } from "@/lib/business-os/operations/documents";
import { MAX_FILE_BYTES, bytesMatchMime } from "@/lib/business-os/files/kinds";

export type UploadFault = "document_too_large" | "checksum_invalid" | "mime_invalid";

/**
 * Checks bytes read back from storage against what the browser declared when it
 * asked for the upload URL. The browser is not trusted: size, checksum and type
 * are all recomputed from the stored object.
 */
export function verifyStoredUpload(input: { mime: string; declaredSha256: string; bytes: Uint8Array }): { checksum: string } | { fault: UploadFault } {
  if (input.bytes.byteLength < 1 || input.bytes.byteLength > MAX_FILE_BYTES) return { fault: "document_too_large" };
  const checksum = sha256Hex(input.bytes);
  if (checksum !== input.declaredSha256) return { fault: "checksum_invalid" };
  if (!bytesMatchMime(input.mime, input.bytes)) return { fault: "mime_invalid" };
  return { checksum };
}
