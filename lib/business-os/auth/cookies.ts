import "server-only";
import { NextResponse } from "next/server";

export const ACCESS_COOKIE = "bos_access";
export const REFRESH_COOKIE = "bos_refresh";
export const CSRF_COOKIE = "bos_csrf";
export const SESSION_COOKIE = "bos_session";
export const PENDING_COOKIE = "bos_pending";

export type CookiePolicy = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
};

const HOUR = 60 * 60;

export function accessCookiePolicy(secure: boolean): CookiePolicy {
  return { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: HOUR };
}

export function refreshCookiePolicy(secure: boolean): CookiePolicy {
  return { httpOnly: true, secure, sameSite: "lax", path: "/api/business-os/auth", maxAge: HOUR * 24 * 14 };
}

export function csrfCookiePolicy(secure: boolean): CookiePolicy {
  return { httpOnly: false, secure, sameSite: "lax", path: "/", maxAge: HOUR * 8 };
}

export function sessionCookiePolicy(secure: boolean): CookiePolicy {
  return { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: HOUR * 24 * 14 };
}

export function pendingCookiePolicy(secure: boolean): CookiePolicy {
  return { httpOnly: true, secure, sameSite: "lax", path: "/api/business-os/auth", maxAge: 60 * 5 };
}

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
};

export function applySessionCookies(response: NextResponse, tokens: SessionTokens, secure: boolean) {
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, accessCookiePolicy(secure));
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, refreshCookiePolicy(secure));
  response.cookies.set(SESSION_COOKIE, tokens.sessionId, sessionCookiePolicy(secure));
  response.cookies.set(PENDING_COOKIE, "", { ...pendingCookiePolicy(secure), maxAge: 0 });
}

export function applyPendingCookies(
  response: NextResponse,
  pending: { accessToken: string; refreshToken: string },
  secure: boolean,
) {
  response.cookies.set(PENDING_COOKIE, JSON.stringify(pending), pendingCookiePolicy(secure));
}

export function applyCsrfCookie(response: NextResponse, token: string, secure: boolean) {
  response.cookies.set(CSRF_COOKIE, token, csrfCookiePolicy(secure));
}

export function clearSessionCookies(response: NextResponse, secure: boolean) {
  response.cookies.set(ACCESS_COOKIE, "", { ...accessCookiePolicy(secure), maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { ...refreshCookiePolicy(secure), maxAge: 0 });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookiePolicy(secure), maxAge: 0 });
  response.cookies.set(PENDING_COOKIE, "", { ...pendingCookiePolicy(secure), maxAge: 0 });
}

export function readPendingSession(value: string | undefined): { accessToken: string; refreshToken: string } | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as { accessToken?: unknown; refreshToken?: unknown };
    if (typeof parsed.accessToken !== "string" || typeof parsed.refreshToken !== "string") return null;
    return { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken };
  } catch {
    return null;
  }
}
