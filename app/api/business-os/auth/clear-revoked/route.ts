import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/business-os/auth/cookies";
import { isSecureRequest } from "@/lib/business-os/auth/http";
import { loadIdentity } from "@/lib/business-os/auth/session";

export async function GET(request: NextRequest) {
  const identity = await loadIdentity().catch(() => ({ kind: "anonymous" as const }));
  if (identity.kind === "ready") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  const response = NextResponse.redirect(new URL("/login", request.url));
  clearSessionCookies(response, isSecureRequest(request));
  return response;
}
