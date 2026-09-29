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
  try {
    if (body.kind === "entity") {
      if (typeof body.legalName !== "string") return jsonError("invalid_body", 400);
      return operationsRpc("save_legal_entity", {
        actor_id: profile.userId,
        payload: {
          id: typeof body.id === "string" ? body.id : null,
          legal_name: body.legalName,
          jurisdiction: typeof body.jurisdiction === "string" ? body.jurisdiction : null,
          registration_reference: typeof body.registrationReference === "string" ? body.registrationReference : null,
          tax_reference: typeof body.taxReference === "string" ? body.taxReference : null,
          address: typeof body.address === "string" ? body.address : null,
          notes: typeof body.notes === "string" ? body.notes : null,
        },
      });
    }
    if (body.kind === "service") {
      if (typeof body.name !== "string") return jsonError("invalid_body", 400);
      return operationsRpc("save_service_registration", {
        actor_id: profile.userId,
        payload: {
          name: body.name,
          project_slug: typeof body.projectSlug === "string" ? body.projectSlug : null,
          legal_entity_id: typeof body.legalEntityId === "string" ? body.legalEntityId : null,
          registration_reference: typeof body.registrationReference === "string" ? body.registrationReference : null,
          renewal_on: optionalDate(body.renewalOn),
          due_on: optionalDate(body.dueOn),
          notes: typeof body.notes === "string" ? body.notes : null,
        },
      });
    }
    return jsonError("invalid_body", 400);
  } catch (error) {
    if (error instanceof MoneyError) return jsonError("invalid_body", 400);
    throw error;
  }
}
