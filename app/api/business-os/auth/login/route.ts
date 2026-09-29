import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { applyPendingCookies, applySessionCookies } from "@/lib/business-os/auth/cookies";
import { gateWrite, isSecureRequest, jsonError, mapAuthError } from "@/lib/business-os/auth/http";
import { createAuthServerClient, createPublishableClient } from "@/lib/business-os/db/client";
import { requireBusinessOsConfig } from "@/lib/business-os/env";

export async function POST(request: NextRequest) {
  const blocked = gateWrite(request, "login");
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid_body", 400);
  }
  const email = typeof (body as { email?: unknown }).email === "string" ? (body as { email: string }).email.trim() : "";
  const password = typeof (body as { password?: unknown }).password === "string" ? (body as { password: string }).password : "";
  if (!email || !password) return jsonError("invalid_body", 400);

  try {
    const config = requireBusinessOsConfig();
    const jar: { name: string; value: string }[] = [];
    const authClient = createAuthServerClient(
      {
        getAll: () => jar,
        setAll: (cookies) => {
          for (const cookie of cookies) {
            const index = jar.findIndex((item) => item.name === cookie.name);
            if (index >= 0) jar[index] = { name: cookie.name, value: cookie.value };
            else jar.push({ name: cookie.name, value: cookie.value });
          }
        },
      },
      config,
    );
    const signed = await authClient.auth.signInWithPassword({ email, password });
    if (signed.error || !signed.data.session) return jsonError("invalid_credentials", 401);

    const session = signed.data.session;
    const factorsClient = createPublishableClient(config);
    const established = await factorsClient.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
    if (established.error || !established.data.session) return jsonError("invalid_credentials", 401);
    const factors = await factorsClient.auth.mfa.listFactors();
    if (factors.error) return jsonError("unavailable", 500);
    const verified = (factors.data?.totp ?? []).filter((factor) => factor.status === "verified");
    const secure = isSecureRequest(request);

    if (verified.length > 0) {
      const response = NextResponse.json({ status: "mfa_required", factorId: verified[0].id });
      applyPendingCookies(
        response,
        { accessToken: session.access_token, refreshToken: session.refresh_token },
        secure,
      );
      return response;
    }

    const response = NextResponse.json({ status: "authenticated", assurance: "aal1" });
    applySessionCookies(
      response,
      {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        sessionId: randomUUID(),
      },
      secure,
    );
    return response;
  } catch (error) {
    return mapAuthError(error);
  }
}
