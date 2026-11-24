import { PROJECT_STACKS } from "@/lib/business-os/projects/stack";

export type HealthResult = { url: string; up: boolean; status: number | null; ms: number };

/** Any HTTP answer below 500 means the server is up (a 403 or a redirect is still a live site). */
async function checkUrl(url: string): Promise<HealthResult> {
  const started = Date.now();
  try {
    const response = await fetch(url, { redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(5000) });
    return { url, up: response.status < 500, status: response.status, ms: Date.now() - started };
  } catch {
    return { url, up: false, status: null, ms: Date.now() - started };
  }
}

/** Checks only the fixed URLs in PROJECT_STACKS, never anything from a request. */
export async function checkProjectHealth(): Promise<HealthResult[]> {
  const urls = [...new Set(PROJECT_STACKS.flatMap((stack) => stack.health ?? []))];
  return Promise.all(urls.map(checkUrl));
}
