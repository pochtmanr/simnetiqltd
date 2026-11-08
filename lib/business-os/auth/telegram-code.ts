import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

/**
 * Telegram as the second factor. A 6-digit code goes to the member's linked
 * Telegram account; only an HMAC of it travels back in a cookie. A correct
 * code earns a signed step-up cookie bound to the user and the session.
 */

export const CODE_TTL_MS = 5 * 60 * 1000;
export const STEP_UP_TTL_MS = 12 * 60 * 60 * 1000;

type Binding = { userId: string; sessionId: string; nowMs: number; key: Buffer };

/** Derived from the bot token with its own label, so it never equals Telegram's "WebAppData" key. */
export function stepUpKey(botToken: string): Buffer {
  return createHmac("sha256", "BusinessOsStepUp").update(botToken).digest();
}

export function generateCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function mac(key: Buffer, parts: string[]): string {
  return createHmac("sha256", key).update(parts.join("|")).digest("base64url");
}

function sameMac(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function parse(value: string | undefined): { exp: number; sig: string } | null {
  const [expRaw, sig, extra] = (value ?? "").split(".");
  const exp = Number(expRaw);
  if (!sig || extra !== undefined || !Number.isSafeInteger(exp)) return null;
  return { exp, sig };
}

export function signCodeTicket(code: string, binding: Binding): string {
  const exp = binding.nowMs + CODE_TTL_MS;
  return `${exp}.${mac(binding.key, ["code", code, binding.userId, binding.sessionId, String(exp)])}`;
}

export function verifyCodeTicket(
  ticket: string | undefined,
  code: string,
  binding: Binding,
): "ok" | "code_invalid" | "code_expired" {
  const parsed = parse(ticket);
  if (!parsed || parsed.exp <= binding.nowMs) return "code_expired";
  if (!/^\d{6}$/.test(code)) return "code_invalid";
  const expected = mac(binding.key, ["code", code, binding.userId, binding.sessionId, String(parsed.exp)]);
  return sameMac(parsed.sig, expected) ? "ok" : "code_invalid";
}

export function signStepUp(binding: Binding): { value: string; expiresAt: number } {
  const exp = binding.nowMs + STEP_UP_TTL_MS;
  return { value: `${exp}.${mac(binding.key, ["step-up", binding.userId, binding.sessionId, String(exp)])}`, expiresAt: exp };
}

/** The step-up expiry in ms when the cookie is valid for this user and session, otherwise null. */
export function stepUpExpiry(value: string | undefined, binding: Binding): number | null {
  const parsed = parse(value);
  if (!parsed || parsed.exp <= binding.nowMs) return null;
  const expected = mac(binding.key, ["step-up", binding.userId, binding.sessionId, String(parsed.exp)]);
  return sameMac(parsed.sig, expected) ? parsed.exp : null;
}

export function codeMessage(code: string): string {
  return `Business OS sign-in code: ${code}. It expires in 5 minutes. If you did not ask for it, ignore this message.`;
}

/** True when Telegram accepted the message. */
export async function sendTelegramCode(input: {
  botToken: string;
  chatId: string;
  code: string;
  fetchImpl?: typeof fetch;
}): Promise<boolean> {
  const send = input.fetchImpl ?? fetch;
  try {
    const response = await send(`https://api.telegram.org/bot${input.botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: input.chatId, text: codeMessage(input.code) }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
