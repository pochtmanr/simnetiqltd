"use client";

async function csrfToken(): Promise<string> {
  await fetch("/api/business-os/auth/csrf", { credentials: "same-origin" });
  const raw = document.cookie.split("; ").find((row) => row.startsWith("bos_csrf="));
  return raw ? decodeURIComponent(raw.slice("bos_csrf=".length)) : "";
}

/** Swaps the 14-day refresh token for a new hour-long access token. True when the session was renewed. */
export async function renewSession(): Promise<boolean> {
  const response = await fetch("/api/business-os/auth/refresh", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json", "x-business-os-csrf": await csrfToken() },
  });
  return response.ok;
}

/** GET a Business OS route, renewing an expired session once before giving up. */
export async function businessGet(path: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(path, { ...init, credentials: "same-origin" });
  if (response.status !== 401 || !(await renewSession())) return response;
  return fetch(path, { ...init, credentials: "same-origin" });
}

/** POST JSON with the CSRF header. An expired session is renewed once and the request retried. */
export async function businessPost(path: string, body: unknown): Promise<{ ok: boolean; payload: Record<string, unknown> }> {
  const send = async () =>
    fetch(path, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json", "x-business-os-csrf": await csrfToken() },
      body: JSON.stringify(body),
    });
  let response = await send();
  if (response.status === 401 && (await renewSession())) response = await send();
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: response.ok, payload };
}

export function explainFinanceError(payload: Record<string, unknown>): string {
  if (payload.error === "step_up_required") return "Step-up required. Open Settings and confirm the authenticator.";
  if (payload.error === "forbidden") return "This membership cannot change finance records.";
  if (payload.error === "csrf") return "The form token was rejected. Reload and try again.";
  if (typeof payload.error === "string") return payload.error.replaceAll("_", " ");
  return "The request failed.";
}

export function resultRecord(payload: Record<string, unknown>): Record<string, unknown> | null {
  return payload.result && typeof payload.result === "object" ? (payload.result as Record<string, unknown>) : null;
}
