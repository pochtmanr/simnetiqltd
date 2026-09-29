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
  if (typeof body.title !== "string") return jsonError("invalid_body", 400);
  try {
    return operationsRpc("create_timeline_event", {
      actor_id: profile.userId,
      payload: {
        title: body.title,
        occurs_on: optionalDate(body.occursOn),
        project_slug: typeof body.projectSlug === "string" ? body.projectSlug : null,
      },
    });
  } catch (error) {
    if (error instanceof MoneyError) return jsonError("invalid_body", 400);
    throw error;
  }
}
