import { SITE_URL } from "@/lib/site";

const CONTENT_SIGNAL = "search=yes, ai-input=yes, ai-train=no";

/** Estimated token count for a body — Cloudflare convention is ~4 chars/token. */
function estimateTokens(body: string): number {
  return Math.ceil(body.length / 4);
}

/** Standard headers for a Markdown response — used by every MD route handler. */
function markdownResponseHeaders(body: string): HeadersInit {
  return {
    "Content-Type": "text/markdown; charset=utf-8",
    "Vary": "Accept",
    "Content-Signal": CONTENT_SIGNAL,
    "x-markdown-tokens": String(estimateTokens(body)),
    "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    "Link": [
      `<${SITE_URL}/llms.txt>; rel="alternate"; type="text/markdown"`,
      `<${SITE_URL}/llms-full.txt>; rel="alternate"; type="text/markdown"`,
    ].join(", "),
  };
}

/** Convenience: build a `Response` for a Markdown body with all headers set. */
export function markdownResponse(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: markdownResponseHeaders(body),
  });
}
