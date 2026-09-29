import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { assertFinanceWriter, assertOwner, assertStepUp, type IdentityProfile } from "@/lib/business-os/auth/authorize";
import { gateWrite, jsonError, mapAuthError } from "@/lib/business-os/auth/http";
import { loadIdentity } from "@/lib/business-os/auth/session";

async function readyProfile(): Promise<IdentityProfile | NextResponse> {
  try {
    const identity = await loadIdentity();
    if (identity.kind !== "ready") return jsonError("unauthenticated", 401);
    return identity.profile;
  } catch (error) {
    return mapAuthError(error);
  }
}

export async function beginOperationsRead(): Promise<IdentityProfile | NextResponse> {
  return readyProfile();
}

export async function beginOperationsWrite(request: NextRequest): Promise<IdentityProfile | NextResponse> {
  const blocked = gateWrite(request, "operations");
  if (blocked) return blocked;
  const profile = await readyProfile();
  if (profile instanceof NextResponse) return profile;
  try {
    assertFinanceWriter(profile.role);
    assertStepUp(profile.assurance);
    return profile;
  } catch (error) {
    return mapAuthError(error);
  }
}

export async function beginOperationsOwner(request: NextRequest): Promise<IdentityProfile | NextResponse> {
  const blocked = gateWrite(request, "operations");
  if (blocked) return blocked;
  const profile = await readyProfile();
  if (profile instanceof NextResponse) return profile;
  try {
    assertOwner(profile.role);
    assertStepUp(profile.assurance);
    return profile;
  } catch (error) {
    return mapAuthError(error);
  }
}
