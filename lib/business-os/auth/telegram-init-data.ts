import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const INIT_DATA_MAX_AGE_SECONDS = 5 * 60;
export const INIT_DATA_FUTURE_SKEW_SECONDS = 30;

export type InitDataFailure = "malformed" | "duplicate_field" | "bad_hash" | "stale" | "future" | "bad_user";

export type ValidInitData = {
  telegramUserId: number;
  username: string | null;
  authDate: number;
  fingerprint: string;
};

function fingerprints(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function parsePairs(raw: string): Map<string, string> | "duplicate_field" | "malformed" {
  if (!raw || raw.includes("\n") || raw.includes("\r")) return "malformed";
  const pairs = new Map<string, string>();
  for (const part of raw.split("&")) {
    if (!part) return "malformed";
    const eq = part.indexOf("=");
    if (eq <= 0) return "malformed";
    let key: string;
    let value: string;
    try {
      key = decodeURIComponent(part.slice(0, eq));
      value = decodeURIComponent(part.slice(eq + 1).replace(/\+/g, " "));
    } catch {
      return "malformed";
    }
    if (!key || pairs.has(key)) return pairs.has(key) ? "duplicate_field" : "malformed";
    pairs.set(key, value);
  }
  return pairs;
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function expectedHash(pairs: Map<string, string>, botToken: string): string {
  const dataCheck = [...pairs.keys()]
    .filter((key) => key !== "hash")
    .sort()
    .map((key) => `${key}=${pairs.get(key)}`)
    .join("\n");
  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  return createHmac("sha256", secret).update(dataCheck).digest("hex");
}

export function validateInitData(
  raw: string,
  botToken: string,
  nowMs: number,
): { ok: true; data: ValidInitData } | { ok: false; reason: InitDataFailure } {
  if (!botToken) return { ok: false, reason: "malformed" };
  const parsed = parsePairs(raw);
  if (parsed === "malformed" || parsed === "duplicate_field") return { ok: false, reason: parsed };
  const hash = parsed.get("hash");
  const authDateRaw = parsed.get("auth_date");
  const userRaw = parsed.get("user");
  if (!hash || !authDateRaw || !userRaw) return { ok: false, reason: "malformed" };
  if (!/^[0-9a-f]+$/i.test(hash)) return { ok: false, reason: "bad_hash" };
  if (!safeEqual(expectedHash(parsed, botToken), hash)) return { ok: false, reason: "bad_hash" };
  if (!/^[0-9]+$/.test(authDateRaw)) return { ok: false, reason: "malformed" };
  const authDate = Number(authDateRaw);
  const nowSeconds = Math.floor(nowMs / 1000);
  if (authDate > nowSeconds + INIT_DATA_FUTURE_SKEW_SECONDS) return { ok: false, reason: "future" };
  if (nowSeconds - authDate > INIT_DATA_MAX_AGE_SECONDS) return { ok: false, reason: "stale" };
  let user: unknown;
  try {
    user = JSON.parse(userRaw);
  } catch {
    return { ok: false, reason: "bad_user" };
  }
  if (!user || typeof user !== "object") return { ok: false, reason: "bad_user" };
  const id = (user as { id?: unknown }).id;
  if (!Number.isSafeInteger(id) || (id as number) <= 0) return { ok: false, reason: "bad_user" };
  const username = (user as { username?: unknown }).username;
  return {
    ok: true,
    data: {
      telegramUserId: id as number,
      username: typeof username === "string" && username ? username : null,
      authDate,
      fingerprint: fingerprints(raw),
    },
  };
}
