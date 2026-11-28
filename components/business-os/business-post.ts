"use client";

import { ensureStepUp } from "@/components/business-os/step-up";

async function csrfToken(): Promise<string> {
  const response = await fetch("/api/business-os/auth/csrf", { credentials: "same-origin" });
  const payload = (await response.json().catch(() => ({}))) as { csrf?: string };
  if (typeof payload.csrf === "string" && payload.csrf) return payload.csrf;
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

async function readPayload(response: Response): Promise<Record<string, unknown>> {
  return (await response.json().catch(() => ({}))) as Record<string, unknown>;
}

/** What the confirmation dialog and the Telegram message call a sensitive request, by route. */
const CONFIRM_LABELS: [string, string][] = [
  ["/finance/drafts/post", "Post an expense"],
  ["/finance/drafts", "Save an expense"],
  ["/finance/allocations", "Allocate an expense"],
  ["/finance/entries/reverse", "Reverse a ledger entry"],
  ["/finance/periods", "Lock or reopen a period"],
  ["/finance/", "Change finance records"],
  ["/providers/revolut/", "Change the bank connection"],
  ["/bank/", "Change bank categories"],
  ["/documents/delete", "Delete a file"],
  ["/integrations", "Change an integration"],
  ["/sync/connections", "Change a data source"],
  ["/operations/reminders", "Change reminders"],
  ["/operations/schedules", "Change a recurring payment"],
  ["/auth/membership", "Change a member's access"],
  ["/auth/telegram/link", "Link another Telegram account"],
];

function confirmLabel(path: string): string | undefined {
  return CONFIRM_LABELS.find(([part]) => path.includes(part))?.[1];
}

/**
 * POST JSON with the CSRF header. Renews session once; if the route needs a confirmed
 * browser, opens the Telegram confirmation (named by `confirm`) and retries once.
 */
export async function businessPost(
  path: string,
  body: unknown,
  options: { confirm?: string } = {},
): Promise<{ ok: boolean; payload: Record<string, unknown> }> {
  const send = async () =>
    fetch(path, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json", "x-business-os-csrf": await csrfToken() },
      body: JSON.stringify(body),
    });

  let response = await send();
  if (response.status === 401 && (await renewSession())) response = await send();

  let payload = await readPayload(response);
  if (response.status === 403 && payload.error === "step_up_required" && (await ensureStepUp(options.confirm ?? confirmLabel(path)))) {
    response = await send();
    payload = await readPayload(response);
  }

  return { ok: response.ok, payload };
}

export function explainFinanceError(payload: Record<string, unknown>): string {
  if (payload.error === "step_up_required") return "This needs your confirmation in Telegram. Try again and tap Approve.";
  if (payload.error === "forbidden") return "This membership cannot change finance records.";
  if (payload.error === "csrf") return "The form token was rejected. Reload and try again.";
  if (typeof payload.error === "string") return payload.error.replaceAll("_", " ");
  return "The request failed.";
}

export function resultRecord(payload: Record<string, unknown>): Record<string, unknown> | null {
  return payload.result && typeof payload.result === "object" ? (payload.result as Record<string, unknown>) : null;
}
