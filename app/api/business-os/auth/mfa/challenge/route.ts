import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE, PENDING_COOKIE, REFRESH_COOKIE, readPendingSession } from "@/lib/business-os/auth/cookies";
import { gateWrite, jsonError, mapAuthError } from "@/lib/business-os/auth/http";
import { createPublishableClient } from "@/lib/business-os/db/client";

async function sessionClient(request: NextRequest) {
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  const pending = readPendingSession(request.cookies.get(PENDING_COOKIE)?.value);
  const tokens = access && refresh ? { accessToken: access, refreshToken: refresh } : pending;
  if (!tokens) return null;
  const client = createPublishableClient();
  const established = await client.auth.setSession({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
  });
  if (established.error || !established.data.session) return null;
  return client;
}

export async function POST(request: NextRequest) {
  const blocked = gateWrite(request, "mfa");
  if (blocked) return blocked;
  let body: { factorId?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  if (typeof body.factorId !== "string" || !body.factorId) return jsonError("invalid_body", 400);
  try {
    const client = await sessionClient(request);
    if (!client) return jsonError("unauthenticated", 401);
    const challenge = await client.auth.mfa.challenge({ factorId: body.factorId });
    if (challenge.error || !challenge.data) return jsonError("mfa_failed", 401);
    return NextResponse.json({ challengeId: challenge.data.id });
  } catch (error) {
    return mapAuthError(error);
  }
}
