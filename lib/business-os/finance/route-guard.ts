import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { assertFinanceWriter, assertStepUp, type IdentityProfile } from "@/lib/business-os/auth/authorize";
import { gateWrite, jsonError, mapAuthError } from "@/lib/business-os/auth/http";
import { loadIdentity } from "@/lib/business-os/auth/session";

export async function beginFinanceWrite(request: NextRequest): Promise<IdentityProfile | NextResponse> {
  const blocked = gateWrite(request, "finance");
  if (blocked) return blocked;
  try {
    const identity = await loadIdentity();
    if (identity.kind !== "ready") return jsonError("unauthenticated", 401);
    assertFinanceWriter(identity.profile.role);
    assertStepUp(identity.profile.assurance);
    return identity.profile;
  } catch (error) {
    return mapAuthError(error);
  }
}

export async function beginFinanceRead(): Promise<IdentityProfile | NextResponse> {
  try {
    const identity = await loadIdentity();
    if (identity.kind !== "ready") return jsonError("unauthenticated", 401);
    return identity.profile;
  } catch (error) {
    return mapAuthError(error);
  }
}
