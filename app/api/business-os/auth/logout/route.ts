import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, clearSessionCookies } from "@/lib/business-os/auth/cookies";
import { gateWrite, isSecureRequest, mapAuthError } from "@/lib/business-os/auth/http";
import { createSecretClient } from "@/lib/business-os/db/client";

export async function POST(request: NextRequest) {
  const blocked = gateWrite(request, "logout");
  if (blocked) return blocked;
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  try {
    if (accessToken) {
      const admin = createSecretClient();
      await admin.auth.admin.signOut(accessToken, "global");
    }
  } catch (error) {
    const response = mapAuthError(error);
    if (response.status !== 503) {
      const cleared = NextResponse.json({ status: "logged_out" });
      clearSessionCookies(cleared, isSecureRequest(request));
      return cleared;
    }
    return response;
  }
  const response = NextResponse.json({ status: "logged_out" });
  clearSessionCookies(response, isSecureRequest(request));
  return response;
}
