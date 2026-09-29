import { queryFor, type PullClaim } from "@/lib/business-os/sync/query";
import { signGet } from "@/lib/business-os/sync/sign";

export type PullOk = { kind: "ok"; body: unknown; paths: string[] };
export type PullRetry = { kind: "retry"; retryAfterSeconds: number; paths: string[] };
export type PullOutage = { kind: "outage"; code: string; retryAfterSeconds: number; paths: string[] };
export type PullResync = { kind: "resync"; paths: string[] };
export type PullResult = PullOk | PullRetry | PullOutage | PullResync;

type FetchImpl = (url: string, init: { method: string; headers: Record<string, string>; redirect: "manual"; signal: AbortSignal }) => Promise<Response>;

const DEFAULT_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_INLINE_WAIT_MS = 2_000;

function retryAfterSeconds(header: string | null): number | null {
  if (!header || !/^[1-9][0-9]*$/.test(header.trim())) return null;
  return Number(header.trim());
}

function backoffSeconds(attempt: number): number {
  return Math.min(2 ** attempt, 60);
}

async function defaultSleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function pullSigned(
  input: {
    claim: PullClaim;
    baseUrl: string;
    keyId: string;
    secret: string;
  },
  options: {
    fetchImpl?: FetchImpl;
    now?: () => number;
    timeoutMs?: number;
    maxAttempts?: number;
    inlineWaitMs?: number;
    sleep?: (ms: number) => Promise<void>;
  } = {},
): Promise<PullResult> {
  if (!input.baseUrl.startsWith("https://") || input.baseUrl.includes("@")) {
    throw new Error("base_url_invalid");
  }
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;
  const maxAttempts = options.maxAttempts ?? DEFAULT_ATTEMPTS;
  const inlineWaitMs = options.inlineWaitMs ?? DEFAULT_INLINE_WAIT_MS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const paths: string[] = [];
  const { path, pairs } = queryFor(input.claim);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const signed = signGet({
      secret: input.secret,
      keyId: input.keyId,
      path,
      query: pairs,
      now: options.now?.(),
    });
    paths.push(signed.urlPath);
    try {
      const response = await fetchImpl(`${input.baseUrl}${signed.urlPath}`, {
        method: "GET",
        headers: signed.headers,
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.status >= 300 && response.status < 400) {
        return { kind: "outage", code: "redirect_rejected", retryAfterSeconds: 60, paths };
      }
      if (response.status === 200) {
        const body = await response.json();
        return { kind: "ok", body, paths };
      }
      if (response.status === 410) {
        return { kind: "resync", paths };
      }
      if (response.status === 429 || response.status === 503) {
  const headerWait = retryAfterSeconds(response.headers.get("retry-after"));
        const wait = headerWait ?? backoffSeconds(attempt);
        const code = response.status === 429 ? "rate_limited" : "source_unavailable";
        const inline = headerWait === null || wait * 1000 <= inlineWaitMs;
        if (attempt < maxAttempts && inline) {
          await sleep(Math.min(wait, Math.max(inlineWaitMs / 1000, 0)) * 1000);
          continue;
        }
        if (response.status === 429) return { kind: "retry", retryAfterSeconds: wait, paths };
        return { kind: "outage", code, retryAfterSeconds: wait, paths };
      }
      return { kind: "outage", code: "source_status", retryAfterSeconds: 60, paths };
    } catch {
      if (attempt < maxAttempts) {
        const waitMs = Math.min(200 * 2 ** (attempt - 1), inlineWaitMs);
        if (waitMs > 0) await sleep(waitMs);
        continue;
      }
      return { kind: "outage", code: "timeout", retryAfterSeconds: 60, paths };
    }
  }
  return { kind: "outage", code: "timeout", retryAfterSeconds: 60, paths };
}
