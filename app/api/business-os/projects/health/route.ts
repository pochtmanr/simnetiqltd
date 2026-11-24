import { NextResponse } from "next/server";
import { jsonError, mapAuthError } from "@/lib/business-os/auth/http";
import { loadIdentity } from "@/lib/business-os/auth/session";
import { checkProjectHealth } from "@/lib/business-os/projects/health";

export async function GET() {
  try {
    const identity = await loadIdentity();
    if (identity.kind !== "ready") return jsonError("unauthenticated", 401);
    const results = await checkProjectHealth();
    return NextResponse.json({ checkedAt: new Date().toISOString(), results }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return mapAuthError(error);
  }
}
