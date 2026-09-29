import "server-only";

const buckets = new Map<string, { count: number; resetAt: number }>();

export const RATE_WINDOW_MS = 10 * 60 * 1000;

export const RATE_LIMITS = {
  login: 10,
  mfa: 10,
  telegram_link: 5,
  telegram_exchange: 10,
  integration: 20,
  sync: 20,
  finance: 30,
  operations: 30,
  refresh: 30,
  logout: 30,
} as const;

export type RateBucket = keyof typeof RATE_LIMITS;

/** Per-instance limiter. A later shared store can replace the map without changing callers. */
export function consumeRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const entry = buckets.get(key);
  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}
