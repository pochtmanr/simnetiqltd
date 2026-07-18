# SEO follow-up work

Ordered by impact. Sections 1–4 are self-contained prompts — paste one per
conversation. Background on why these exist is in the commit that fixed the
first round of indexing defects (`22961f6`).

---

## 0. DO THIS FIRST — Vercel dashboard, no conversation needed

Serving host and declared canonical still disagree. Every page says its real URL
is the apex; the apex 307s to www. All 45 sitemap URLs redirect. Nothing else in
this document matters as much.

Vercel → project → Settings → Domains. **Order matters** — reversing these two
steps creates a redirect loop.

**Step 1 — `simnetiq.store`:**
- Redirect to Another Domain: `www.simnetiq.store` → change to **No Redirect**
- Connect to an environment: **Production**

**Step 2 — `www.simnetiq.store`:**
- Redirect to Another Domain: **`simnetiq.store`**
- Status code: **308 Permanent Redirect** (not 307)

Between the two steps both hosts serve 200 for a minute. That's harmless.

`simnetiqstore.vercel.app` needs no action. It's Vercel's built-in deployment
URL, can't be removed, and isn't primary. It serves 200 but its canonical already
points at `simnetiq.store`, so Google consolidates it.

**Why 308 here but 307 in `proxy.ts`:** the www→apex redirect is identical for
every visitor forever, so permanent is correct and passes ranking signals. The
locale redirect in `proxy.ts` varies per user (cookie + `Accept-Language`); a 308
would be permanently browser-cached and trap someone in whichever locale they
first landed on. Invariant → permanent. Varies → temporary.

**Also pending:** "DNS Change Recommended" on both domains. Records are split
across two generations of Vercel infrastructure —

```
simnetiq.store      A     76.76.21.21                              (older generic IP)
www.simnetiq.store  CNAME 8e6e3bfd7ffb9c38.vercel-dns-017.com      (current)
```

Vercel's docs say `76.76.21.21` is a generic value and you should inspect the
specific domain for the right record. Click the "DNS Change Recommended" label,
or run `vercel domains inspect simnetiq.store`. Matters more once the apex is the
serving domain rather than a redirect.

### Verify after both steps

```bash
curl -sI https://www.simnetiq.store/en | grep -iE '^(HTTP|location)'   # expect 308 -> apex
curl -sI https://simnetiq.store/en     | grep -i '^HTTP'                # expect 200
curl -s  https://simnetiq.store/en | grep -oE '<link rel="canonical"[^>]*>'
# canonical must name the same host that served the page
```

---

## 1. Core Web Vitals (performance 79 → target 95+)

```
Performance work on simnetiq.store (Next.js 16.2.2, App Router, React 19,
Tailwind v4, locales en/he/ru under app/[locale]/).

Mobile Lighthouse performance is 79. Read AGENTS.md first — this is Next 16,
check node_modules/next/dist/docs/ before writing code.

Fix these, measured not assumed:

1. components/booking-panel.tsx — the Cal.eu embed is dynamic()'d but mounted
   unconditionally at components/home-page-client.tsx:432, so app.cal.eu/embed/embed.js
   plus an iframe load right after hydration on every homepage visit. Gate it behind
   a click or IntersectionObserver so it only loads when someone intends to book.
2. No preconnect hints exist anywhere. Add them for app.cal.eu and cal.eu — but only
   if the embed still loads eagerly after fix 1. If it's click-gated, preconnect on
   hover/intent instead.
3. app/[locale]/layout.tsx loads EIGHT next/font/google families globally
   (Inter, Space Grotesk, JetBrains Mono, Instrument Serif, Rubik, Lunasima,
   Geist, Geist Mono). Five are used only on /projects/doppler-vpn and
   /projects/visapassage. Scope those to the routes that use them.
4. app/[locale]/layout.tsx calls cookies() for theme-pref, which forces every
   route dynamic despite generateStaticParams(). Live pages return
   cache-control: private, no-cache, no-store. Find a way to keep the no-flash
   theme behaviour while allowing static/ISR rendering.
5. components/hero-circuit.tsx is an 830-line canvas requestAnimationFrame
   animation hydrating above the fold. Assess its main-thread cost and defer or
   simplify if it's material.

Do NOT touch components/text-reveal.tsx or app/globals.css .text-reveal-word —
the transform-only animation there is deliberate, it keeps the LCP h1 paintable.
Motion serializes its `initial` state into the SSR payload, so an opacity fade
would ship the h1 invisible again.

Measure before and after with Lighthouse or the PSI API and report both numbers.
```

---

## 2. Accessibility + best-practices audit

```
Accessibility and best-practices pass on simnetiq.store (Next.js 16 App Router).

Known issues from Lighthouse:

1. components/contact-disclosure.tsx:66-83 — the collapsed panel is
   aria-hidden="true" but its input/textarea/button children stay in the tab
   order (it uses height:0 + overflow:hidden, not hidden/inert). Focusable
   elements inside an aria-hidden subtree is an axe violation. Use inert.
2. Console error in production: "Uncaught Error: iframe doesn't exist.
   createIframe must be called before doInIframe" from app.cal.eu/embed/embed.js.
   Likely the key={`${theme}-${tz}`} remount on <Cal> in components/booking-panel.tsx.
3. Third-party cookie (__cf_bm) and a deprecated Shared Storage API warning, both
   from the Cal embed. Determine what's actually in our control vs vendor-side.

Then run a full axe pass over every route (13 pages x 3 locales, including the
RTL Hebrew locale, which is worth checking specifically) and fix what you find.
Report what you changed and what you deliberately left.
```

---

## 3. Content & ranking — the actual long game

```
SEO content strategy for simnetiq.store, a London software studio (Next.js 16,
locales en/he/ru, copy lives in messages/{en,he,ru}.json and lib/services.ts).

The technical indexing issues are fixed. The remaining problem is that the site
is 15 pages with no content engine — nothing to rank for beyond brand terms.

1. Audit what we could realistically rank for. We sell mobile/desktop apps,
   Next.js+Supabase web platforms, AI/LLM integration, VPN infrastructure, to a
   London/UK market. Identify realistic keyword targets given near-zero domain
   authority — long-tail and intent-led, not head terms.
2. Assess whether the existing pages actually target anything, or just describe
   us. Recommend concrete copy changes.
3. Propose whether to add a blog/writing surface. There is no CMS, no MDX — it
   would be net-new infrastructure. Give me a recommendation with the honest
   maintenance cost, not just "yes, content is good."
4. Add FAQPage schema where it genuinely fits (services and case-study pages).
   components/structured-data.tsx already has Organization, ProfessionalService,
   Website, Breadcrumb, Article, ItemList, Service schemas — follow those patterns.

Push back if you think part of this isn't worth doing.
```

---

## 4. Cleanup — small, low risk, do when convenient

```
Cleanup pass on simnetiq.store:

1. npm run lint fails on two pre-existing issues, and because the script is
   `eslint && npm run check:i18n`, the i18n parity check never runs in CI:
   - components/booking-panel.tsx:82 — setState called synchronously in an effect
   - app/[locale]/page.tsx:9 — SITE_URL imported but unused
2. lib/seo-meta.ts has ROUTE_COPY.subscribe and .unsubscribe, plus matching keys
   in all three message files, with no corresponding pages. Remove or build the pages.
3. lib/markdown-negotiation.ts exports wantsMarkdown, CONTENT_SIGNAL and
   buildLinkHeader that nothing imports — Accept-header negotiation was designed
   but never wired up. Decide: finish it or delete it.
4. SITE_URL = "https://simnetiq.store" is duplicated as a literal across 9 files.
   Consolidate to one exported constant.
5. Verify every advertised markdown alternate resolves. Some <link rel="alternate"
   type="text/markdown"> URLs have 404'd in production before.
```

---

## Tool access that would materially help

| Tool | What it unlocks | Effort |
|---|---|---|
| **PageSpeed Insights API key** | Claude pulls Lighthouse scores + Core Web Vitals directly instead of you pasting reports. Free: console.cloud.google.com → enable PageSpeed Insights API → create key. Unkeyed requests get 429'd. | trivial |
| **Search Console access** | The real gap. Impressions, queries, coverage errors, which host holds equity, what Google actually indexed. | see below |
| **Playwright / browser MCP** | Drive the page and measure real LCP/CLS, and verify a11y fixes by observation rather than inferring from HTML. | medium |
| **CrUX API key** | Field data (real users) vs lab data. Same console, same flow as PSI. | trivial |

**Search Console — three options, best first:**

1. **Service account + GSC API.** Create a service account in Google Cloud, enable
   the Search Console API, add its email as a user on the property, drop the JSON
   key somewhere gitignored. Then a small read-only query script gives durable,
   re-runnable access from any session. Best option.
2. **Manual CSV export.** GSC → Performance → Export → commit the CSV. Zero setup,
   stale the moment you export it.
3. **A Search Console MCP server**, if one exists that you trust. There is no GSC
   integration available by default.

Vercel MCP is already connected — deployments and runtime logs need no extra setup.
