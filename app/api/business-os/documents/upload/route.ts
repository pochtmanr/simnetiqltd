import { NextRequest, NextResponse } from "next/server";
import { jsonError, mapAuthError, mapRpcError } from "@/lib/business-os/auth/http";
import { createSecretClient } from "@/lib/business-os/db/client";
import { DocumentRejected, sha256Hex, validateDocumentBytes } from "@/lib/business-os/operations/documents";
import { operationsData } from "@/lib/business-os/operations/rpc";
import { beginOperationsWrite } from "@/lib/business-os/operations/route-guard";

const BUCKET = "business-os-documents";

function text(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(request: NextRequest) {
  const profile = await beginOperationsWrite(request);
  if (profile instanceof NextResponse) return profile;
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("invalid_body", 400);
  }
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("invalid_body", 400);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const checksum = sha256Hex(bytes);
  try {
    validateDocumentBytes({ mime: file.type, size: bytes.byteLength, actualSha256: checksum });
  } catch (error) {
    if (error instanceof DocumentRejected) return jsonError(error.code, 400);
    return mapAuthError(error);
  }

  const existingId = text(form.get("documentId"));
  let documentId = existingId;
  let objectPath: string | null = null;
  if (!documentId) {
    const tags = (text(form.get("tags")) ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const created = await operationsData("register_upload", {
      actor_id: profile.userId,
      payload: {
        title: text(form.get("title")),
        category: text(form.get("category")),
        vendor: text(form.get("vendor")),
        tags,
        project_slug: text(form.get("project")),
        document_on: text(form.get("documentOn")),
        mime_type: file.type,
        byte_size: bytes.byteLength,
      },
    });
    if (created instanceof NextResponse) return created;
    const body = created as { id?: string; objectPath?: string } | null;
    if (!body?.id || !body.objectPath) return jsonError("unavailable", 500);
    documentId = body.id;
    objectPath = body.objectPath;
  } else {
    const authorized = await operationsData("authorize_document", { actor_id: profile.userId, document_id: documentId });
    if (authorized instanceof NextResponse) return authorized;
    const body = authorized as { objectPath?: string; origin?: string } | null;
    if (!body?.objectPath || body.origin !== "central") return jsonError("invalid_body", 400);
    objectPath = body.objectPath;
  }

  const stored = await createSecretClient().storage.from(BUCKET).upload(objectPath, bytes, {
    contentType: file.type,
    upsert: Boolean(existingId),
  });
  if (stored.error) {
    return NextResponse.json({ error: "upload_incomplete", documentId }, { status: 502 });
  }
  const completed = await operationsData("complete_upload", {
    actor_id: profile.userId,
    document_id: documentId,
    checksum,
    mime_type: file.type,
    byte_size: bytes.byteLength,
  });
  if (completed instanceof NextResponse) return completed;
  return NextResponse.json({ result: { id: documentId } });
}

export function mapUploadError(error: { message?: string } | null) {
  return mapRpcError(error);
}
