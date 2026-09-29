import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/business-os/auth/http";
import { createSecretClient } from "@/lib/business-os/db/client";
import { isUuid } from "@/lib/business-os/finance/body";
import { readDocumentAccess, signDocumentAccess } from "@/lib/business-os/operations/documents";
import { operationsData } from "@/lib/business-os/operations/rpc";
import { beginOperationsRead, beginOperationsWrite } from "@/lib/business-os/operations/route-guard";

const BUCKET = "business-os-documents";

function secret(): string | null {
  const value = process.env.BUSINESS_OS_JOB_SECRET?.trim();
  return value || null;
}

export async function POST(request: NextRequest) {
  const profile = await beginOperationsWrite(request);
  if (profile instanceof NextResponse) return profile;
  const key = secret();
  if (!key) return jsonError("business_os_unconfigured", 503);
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  if (!isUuid(body.documentId)) return jsonError("invalid_body", 400);
  const authorized = await operationsData("authorize_document", {
    actor_id: profile.userId,
    document_id: body.documentId,
  });
  if (authorized instanceof NextResponse) return authorized;
  const row = authorized as { uploadStatus?: string; origin?: string } | null;
  if (!row || (row.origin === "central" && row.uploadStatus !== "stored")) return jsonError("upload_incomplete", 400);
  const token = signDocumentAccess(key, body.documentId, Date.now());
  const preview = body.preview === true ? "&preview=1" : "";
  return NextResponse.json({ url: `/api/business-os/documents/file?token=${encodeURIComponent(token)}${preview}` });
}

export async function GET(request: NextRequest) {
  const key = secret();
  if (!key) return jsonError("business_os_unconfigured", 503);
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return jsonError("invalid_body", 400);
  const grant = readDocumentAccess(key, token, Date.now());
  if ("invalid" in grant) return jsonError("forbidden", 403);
  if ("expired" in grant) return jsonError("expired_link", 403);
  const profile = await beginOperationsRead();
  if (profile instanceof NextResponse) return profile;
  const authorized = await operationsData("authorize_document", {
    actor_id: profile.userId,
    document_id: grant.documentId,
  });
  if (authorized instanceof NextResponse) return authorized;
  const row = authorized as { origin?: string; objectPath?: string | null; mimeType?: string | null; uploadStatus?: string } | null;
  if (!row) return jsonError("forbidden", 403);
  if (row.origin === "source") return jsonError("source_bytes_unavailable", 409);
  if (row.uploadStatus !== "stored" || !row.objectPath) return jsonError("upload_incomplete", 400);
  const preview = request.nextUrl.searchParams.get("preview") === "1";
  const signed = await createSecretClient().storage.from(BUCKET).createSignedUrl(row.objectPath, 60, {
    download: preview ? false : true,
  });
  if (signed.error || !signed.data?.signedUrl) return jsonError("unavailable", 404);
  return NextResponse.redirect(signed.data.signedUrl);
}
