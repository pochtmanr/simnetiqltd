import "server-only";
import { timingSafeEqual } from "node:crypto";

export class CsrfError extends Error {
  readonly code = "csrf";

  constructor() {
    super("csrf");
  }
}

export function assertSameOrigin(headers: Headers): void {
  const origin = headers.get("origin");
  const host = headers.get("host");
  if (!origin || !host) throw new CsrfError();
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new CsrfError();
  }
  if (originHost !== host) throw new CsrfError();
}

export function assertCsrfToken(cookieValue: string | undefined, headerValue: string | null): void {
  if (!cookieValue || !headerValue) throw new CsrfError();
  const left = Buffer.from(cookieValue);
  const right = Buffer.from(headerValue);
  if (left.length !== right.length || !timingSafeEqual(left, right)) throw new CsrfError();
}

export function assertCsrf(headers: Headers, csrfCookie: string | undefined): void {
  assertSameOrigin(headers);
  assertCsrfToken(csrfCookie, headers.get("x-business-os-csrf"));
}
