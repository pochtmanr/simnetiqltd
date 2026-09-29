import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const DOCUMENT_GRANT_TTL_MS = 60_000;

const ALLOWED = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

export class DocumentRejected extends Error {
  constructor(readonly code: "mime_invalid" | "document_too_large" | "checksum_invalid") {
    super(code);
  }
}

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function validateDocumentBytes(input: { mime: string; size: number; actualSha256: string }): void {
  if (!ALLOWED.has(input.mime)) throw new DocumentRejected("mime_invalid");
  if (!Number.isInteger(input.size) || input.size < 1 || input.size > MAX_DOCUMENT_BYTES) {
    throw new DocumentRejected("document_too_large");
  }
  if (!/^[a-f0-9]{64}$/.test(input.actualSha256)) throw new DocumentRejected("checksum_invalid");
}

type Grant = { documentId: string; exp: number };

export function signDocumentAccess(secret: string, documentId: string, now: number): string {
  const body = Buffer.from(JSON.stringify({ documentId, exp: now + DOCUMENT_GRANT_TTL_MS } satisfies Grant)).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readDocumentAccess(
  secret: string,
  token: string,
  now: number,
): { documentId: string } | { expired: true } | { invalid: true } {
  const [body, sig] = token.split(".");
  if (!body || !sig) return { invalid: true };
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return { invalid: true };
  try {
    const grant = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Grant;
    if (!grant || typeof grant.documentId !== "string" || typeof grant.exp !== "number") return { invalid: true };
    if (now >= grant.exp) return { expired: true };
    return { documentId: grant.documentId };
  } catch {
    return { invalid: true };
  }
}
