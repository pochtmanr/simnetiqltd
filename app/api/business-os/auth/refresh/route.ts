import { NextRequest, NextResponse } from "next/server";
import { applySessionCookies, REFRESH_COOKIE, SESSION_COOKIE } from "@/lib/business-os/auth/cookies";
import { gateWrite, isSecureRequest, jsonError, mapAuthError } from "@/lib/business-os/auth/http";
import { createPublishableClient } from "@/lib/business-os/db/client";
import { randomUUID } from "node:crypto";

export async function POST(request: NextRequest) {
  const blocked = gateWrite(request, "refresh");
  if (blocked) return blocked;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return jsonError("unauthenticated", 401);
  try {
    const client = createPublishableClient();
    const refreshed = await client.auth.refreshSession({ refresh_token: refreshToken });
    if (refreshed.error || !refreshed.data.session) return jsonError("unauthenticated", 401);
    const response = NextResponse.json({ status: "refreshed" });
    applySessionCookies(
      response,
      {
        accessToken: refreshed.data.session.access_token,
        refreshToken: refreshed.data.session.refresh_token,
        sessionId: request.cookies.get(SESSION_COOKIE)?.value ?? randomUUID(),
      },
      isSecureRequest(request),
    );
    return response;
  } catch (error) {
    return mapAuthError(error);
  }
}
