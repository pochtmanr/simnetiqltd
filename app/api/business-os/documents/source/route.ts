import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/business-os/auth/http";
import { optionalDate } from "@/lib/business-os/finance/body";
import { MoneyError } from "@/lib/business-os/finance/money";
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
  if (typeof body.title !== "string" || typeof body.projectSlug !== "string" || typeof body.sourceDocumentId !== "string") {
    return jsonError("invalid_body", 400);
  }
  if (typeof body.provenance !== "string" || body.provenance.includes("://")) return jsonError("invalid_body", 400);
  try {
    return operationsRpc("import_source_document", {
      actor_id: profile.userId,
      payload: {
        title: body.title,
        project_slug: body.projectSlug,
        source_document_id: body.sourceDocumentId,
        source_provenance: body.provenance,
        category: typeof body.category === "string" ? body.category : null,
        vendor: typeof body.vendor === "string" ? body.vendor : null,
        document_on: optionalDate(body.documentOn),
      },
    });
  } catch (error) {
    if (error instanceof MoneyError) return jsonError("invalid_body", 400);
    throw error;
  }
}
