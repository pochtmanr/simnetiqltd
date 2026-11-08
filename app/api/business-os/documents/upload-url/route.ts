import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/business-os/auth/http";
import { createSecretClient } from "@/lib/business-os/db/client";
import { requireBusinessOsConfig } from "@/lib/business-os/env";
import { DOCUMENTS_BUCKET } from "@/lib/business-os/files/bucket";
import { MAX_FILE_BYTES, mimeFromName, normalizeFolder, parseTags, titleFromName } from "@/lib/business-os/files/kinds";
import { operationsData } from "@/lib/business-os/operations/rpc";
import { beginOperationsWrite } from "@/lib/business-os/operations/route-guard";

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Step 1 of an upload: register a pending document and hand the browser a
 * one-time signed URL so the bytes go straight to Storage, not through this
 * function (Vercel caps request bodies at 4.5 MB).
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
  const fileName = text(body.fileName);
  const mime = fileName ? mimeFromName(fileName) : null;
  if (!fileName || !mime) return jsonError("mime_invalid", 400);
  const size = body.size;
  if (typeof size !== "number" || !Number.isInteger(size) || size < 1 || size > MAX_FILE_BYTES) return jsonError("document_too_large", 400);
  if (typeof body.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(body.sha256)) return jsonError("checksum_invalid", 400);
  const folder = normalizeFolder(typeof body.folder === "string" ? body.folder : "");
  if (folder === null) return jsonError("folder_invalid", 400);
  const tags = parseTags(Array.isArray(body.tags) ? body.tags.filter((tag): tag is string => typeof tag === "string") : (text(body.tags) ?? ""));
  if (tags === null) return jsonError("tag_invalid", 400);

  const created = await operationsData("register_upload", {
    actor_id: profile.userId,
    payload: {
      title: text(body.title) ?? titleFromName(fileName),
      folder,
      tags,
      category: text(body.category),
      vendor: text(body.vendor),
      project_slug: text(body.project),
      document_on: text(body.documentOn),
      mime_type: mime,
      byte_size: size,
    },
  });
  if (created instanceof NextResponse) return created;
  const registered = created as { id?: string; objectPath?: string } | null;
  if (!registered?.id || !registered.objectPath) return jsonError("unavailable", 500);

  const signed = await createSecretClient().storage.from(DOCUMENTS_BUCKET).createSignedUploadUrl(registered.objectPath);
  if (signed.error || !signed.data?.signedUrl) return NextResponse.json({ error: "upload_incomplete", documentId: registered.id }, { status: 502 });
  // The publishable key is public by design; the storage gateway expects it alongside the one-time token.
  const apikey = requireBusinessOsConfig().publishableKey;
  return NextResponse.json({ result: { documentId: registered.id, uploadUrl: signed.data.signedUrl, mime, apikey } });
}
