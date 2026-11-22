/**
 * Last real content change per public route, used for sitemap `lastmod` and
 * JSON-LD `dateModified`.
 *
 * These dates are maintained BY HAND. When a page's content changes (its page
 * file, its content source in lib/, or its section of messages/*.json), bump
 * the entry here in the same commit. Never derive them from the build or
 * request time — search engines stop trusting lastmod once it tracks deploys.
 *
 * Keys are the route path after the locale segment ("" for home).
 */
export const CONTENT_LAST_MODIFIED: Record<string, string> = {
  "": "2026-09-29",
  "/projects": "2026-11-22",
  "/projects/argus-browser": "2026-11-22",
  "/projects/doppler-vpn": "2026-11-22",
  "/projects/physics-explained": "2026-11-22",
  "/projects/green-flagged": "2026-11-22",
  "/projects/sms-code": "2026-11-22",
  "/projects/visapassage": "2026-11-22",
  "/services": "2026-09-28",
  "/services/mobile-desktop": "2026-09-28",
  "/services/web-platforms": "2026-09-28",
  "/services/ai-automation": "2026-09-28",
  "/how-we-work": "2026-09-27",
  "/how-we-work/work-directly-with-engineers": "2026-09-27",
  "/how-we-work/fixed-price-scope": "2026-09-27",
  "/how-we-work/code-ownership": "2026-09-27",
  "/how-we-work/support-after-launch": "2026-09-27",
  "/about": "2026-09-27",
};

/** Fallback for routes without an entry: the last site-wide content change. */
export const SITE_LAST_MODIFIED = "2026-09-29";

export function lastModifiedFor(path: string): string {
  return CONTENT_LAST_MODIFIED[path] ?? SITE_LAST_MODIFIED;
}
