import "server-only";
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

/**
 * Telegram as the second factor. A 6-digit code goes to the member's linked
 * Telegram account; only an HMAC of it travels back in a cookie. A correct
 * code, or a tap on Approve in Telegram, earns a signed step-up cookie bound to
 * the user and this browser (the device cookie), so the browser stays trusted
 * across sign-ins until it expires or the member logs out.
 */

export const CODE_TTL_MS = 5 * 60 * 1000;
export const STEP_UP_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type Binding = { userId: string; sessionId: string; nowMs: number; key: Buffer };
type DeviceBinding = { userId: string; deviceId: string; nowMs: number; key: Buffer };

export function newDeviceId(): string {
  return randomBytes(32).toString("base64url");
}

/** What the database stores for a device: never the cookie value itself. */
export function deviceHash(deviceId: string): string {
  return createHash("sha256").update(deviceId).digest("hex");
}

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

export function signStepUp(binding: DeviceBinding): { value: string; expiresAt: number } {
  const exp = binding.nowMs + STEP_UP_TTL_MS;
  return { value: `${exp}.${mac(binding.key, ["step-up", binding.userId, binding.deviceId, String(exp)])}`, expiresAt: exp };
}

/** The step-up expiry in ms when the cookie is valid for this user and device, otherwise null. */
export function stepUpExpiry(value: string | undefined, binding: DeviceBinding): number | null {
  const parsed = parse(value);
  if (!parsed || parsed.exp <= binding.nowMs) return null;
  const expected = mac(binding.key, ["step-up", binding.userId, binding.deviceId, String(parsed.exp)]);
  return sameMac(parsed.sig, expected) ? parsed.exp : null;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** HTML for Telegram: the code is tap-to-copy, and the label says what the browser asked for. */
export function codeMessage(code: string, label: string): string {
  return [
    "<b>Business OS: confirm it's you</b>",
    `Requested for: ${escapeHtml(label)}`,
    "",
    "Tap Approve to trust that browser for 30 days.",
    `Or type this code there: <code>${code}</code>`,
    "",
    "It expires in 5 minutes. If this was not you, tap Not me.",
  ].join("\n");
}

/** True when Telegram accepted the message. */
export async function sendTelegramCode(input: {
  botToken: string;
  chatId: string;
  code: string;
  label: string;
  /** https URL of the approve page; the buttons are left out when it is missing. */
  approveUrl?: string | null;
  fetchImpl?: typeof fetch;
}): Promise<boolean> {
  const send = input.fetchImpl ?? fetch;
  try {
    const response = await send(`https://api.telegram.org/bot${input.botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: input.chatId,
        text: codeMessage(input.code, input.label),
        parse_mode: "HTML",
        ...(input.approveUrl
          ? {
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "Approve", web_app: { url: input.approveUrl } },
                    { text: "Not me", web_app: { url: `${input.approveUrl}&d=1` } },
                  ],
                ],
              },
            }
          : {}),
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

const usernames = new Map<string, string | null>();

/** The bot's @username, for an "Open Telegram" link. Asked once per process. */
export async function botUsername(botToken: string, fetchImpl: typeof fetch = fetch): Promise<string | null> {
  if (usernames.has(botToken)) return usernames.get(botToken) ?? null;
  try {
    const response = await fetchImpl(`https://api.telegram.org/bot${botToken}/getMe`);
    const payload = (await response.json()) as { result?: { username?: unknown } };
    const username = typeof payload.result?.username === "string" ? payload.result.username : null;
    if (response.ok) usernames.set(botToken, username);
    return username;
  } catch {
    return null;
  }
}
