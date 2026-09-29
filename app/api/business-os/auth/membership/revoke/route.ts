import { NextRequest, NextResponse } from "next/server";
import { assertOwner, assertStepUp } from "@/lib/business-os/auth/authorize";
import { gateWrite, jsonError, mapAuthError, mapRpcError } from "@/lib/business-os/auth/http";
import { loadIdentity } from "@/lib/business-os/auth/session";
import { createSecretClient } from "@/lib/business-os/db/client";

export async function POST(request: NextRequest) {
  const blocked = gateWrite(request, "integration");
  if (blocked) return blocked;
  let body: { membershipId?: unknown; reason?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  if (typeof body.membershipId !== "string" || typeof body.reason !== "string") return jsonError("invalid_body", 400);
  try {
    const identity = await loadIdentity();
    if (identity.kind !== "ready") return jsonError("unauthenticated", 401);
    assertOwner(identity.profile.role);
    assertStepUp(identity.profile.assurance);
    const admin = createSecretClient();
    const revoked = await admin.schema("business_os").rpc("revoke_membership", {
      actor_id: identity.profile.userId,
      membership_id: body.membershipId,
      reason: body.reason,
    });
    const failure = mapRpcError(revoked.error);
    if (failure) return failure;
    return NextResponse.json({ status: "revoked" });
  } catch (error) {
    return mapAuthError(error);
  }
}
