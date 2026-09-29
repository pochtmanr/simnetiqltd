import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { assuranceFromAccessToken } from "@/lib/business-os/auth/authorize";
import {
  ACCESS_COOKIE,
  applySessionCookies,
  PENDING_COOKIE,
  REFRESH_COOKIE,
  SESSION_COOKIE,
  readPendingSession,
} from "@/lib/business-os/auth/cookies";
import { gateWrite, isSecureRequest, jsonError, mapAuthError } from "@/lib/business-os/auth/http";
import { createPublishableClient } from "@/lib/business-os/db/client";

export async function POST(request: NextRequest) {
  const blocked = gateWrite(request, "mfa");
  if (blocked) return blocked;
  let body: { factorId?: unknown; challengeId?: unknown; code?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  if (typeof body.factorId !== "string" || typeof body.challengeId !== "string" || typeof body.code !== "string") {
    return jsonError("invalid_body", 400);
  }
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  const pending = readPendingSession(request.cookies.get(PENDING_COOKIE)?.value);
  const tokens = access && refresh ? { accessToken: access, refreshToken: refresh } : pending;
  if (!tokens) return jsonError("unauthenticated", 401);

  try {
    const client = createPublishableClient();
    const established = await client.auth.setSession({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });
    if (established.error) return jsonError("unauthenticated", 401);
    const verified = await client.auth.mfa.verify({
      factorId: body.factorId,
      challengeId: body.challengeId,
      code: body.code,
    });
    if (verified.error || !verified.data?.access_token || !verified.data.refresh_token) return jsonError("mfa_failed", 401);
    const sessionId = request.cookies.get(SESSION_COOKIE)?.value ?? randomUUID();
    const response = NextResponse.json({
      status: "authenticated",
      assurance: assuranceFromAccessToken(verified.data.access_token),
    });
    applySessionCookies(
      response,
      {
        accessToken: verified.data.access_token,
        refreshToken: verified.data.refresh_token,
        sessionId,
      },
      isSecureRequest(request),
    );
    return response;
  } catch (error) {
    return mapAuthError(error);
  }
}
