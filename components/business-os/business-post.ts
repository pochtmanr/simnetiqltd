"use client";

export async function businessPost(path: string, body: unknown): Promise<{ ok: boolean; payload: Record<string, unknown> }> {
  await fetch("/api/business-os/auth/csrf", { credentials: "same-origin" });
  const raw = document.cookie.split("; ").find((row) => row.startsWith("bos_csrf="));
  const token = raw ? decodeURIComponent(raw.slice("bos_csrf=".length)) : "";
  const response = await fetch(path, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json", "x-business-os-csrf": token },
    body: JSON.stringify(body),
  });
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
