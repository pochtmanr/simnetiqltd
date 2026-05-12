export const CONTENT_SIGNAL = "search=yes, ai-input=yes, ai-train=no";

const SITE_URL = "https://simnetiq.store";

const STATIC_LINKS: string[] = [
  `<${SITE_URL}/llms.txt>; rel="alternate"; type="text/markdown"`,
  `<${SITE_URL}/llms-full.txt>; rel="alternate"; type="text/markdown"`,
  `<${SITE_URL}/sitemap.xml>; rel="sitemap"; type="application/xml"`,
  `<${SITE_URL}/.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"`,
];

/**
 * Returns true when the request prefers `text/markdown` over `text/html`.
 * Handles `q=` weights per RFC 9110 §12.5.1. Falls back to false on parse error.
 */
export function wantsMarkdown(accept: string | null | undefined): boolean {
  if (!accept) return false;
  const entries = accept
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  if (entries.length === 0) return false;

  let mdQ = -1;
  let htmlQ = -1;
  for (const entry of entries) {
    const [type, ...params] = entry.split(";").map((s) => s.trim());
    let q = 1;
    for (const p of params) {
      if (p.startsWith("q=")) {
        const parsed = Number.parseFloat(p.slice(2));
        if (!Number.isNaN(parsed)) q = parsed;
      }
    }
    if (type === "text/markdown" || type === "text/x-markdown") {
      mdQ = Math.max(mdQ, q);
    }
    if (type === "text/html") {
      htmlQ = Math.max(htmlQ, q);
    }
  }
  if (mdQ <= 0) return false;
  return mdQ > htmlQ;
}

/** Estimated token count for a body — Cloudflare convention is ~4 chars/token. */
export function estimateTokens(body: string): number {
  return Math.ceil(body.length / 4);
}

/**
 * Build the `Link:` header value for the home + key MD-supported pages.
 * Pass `selfMdUrl` for the per-page MD alternate of the current page.
 * Pass `serviceDocUrl` to additionally advertise the human service catalog.
 */
export function buildLinkHeader(opts: {
  selfMdUrl?: string;
  serviceDocUrl?: string;
}): string {
  const parts = [...STATIC_LINKS];
  if (opts.selfMdUrl) {
    parts.push(`<${opts.selfMdUrl}>; rel="alternate"; type="text/markdown"`);
  }
  if (opts.serviceDocUrl) {
    parts.push(`<${opts.serviceDocUrl}>; rel="service-doc"; type="text/html"`);
  }
  return parts.join(", ");
}

/**
 * Standard headers for a Markdown response — used by every MD route handler
 * and by the proxy's content-negotiation rewrite path.
 */
export function markdownResponseHeaders(body: string): HeadersInit {
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
