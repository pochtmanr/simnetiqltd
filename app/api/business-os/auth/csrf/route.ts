import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { applyCsrfCookie, CSRF_COOKIE } from "@/lib/business-os/auth/cookies";
import { isSecureRequest } from "@/lib/business-os/auth/http";

export async function GET(request: NextRequest) {
  const existing = request.cookies.get(CSRF_COOKIE)?.value;
  const token = existing && existing.length >= 32 ? existing : randomBytes(32).toString("base64url");
  const response = NextResponse.json({ ok: true });
  applyCsrfCookie(response, token, isSecureRequest(request));
  return response;
}
