import {
  getServices,
  getServiceFullTitle,
  type Service,
} from "@/lib/services";
import { ROUTE_COPY } from "@/lib/seo-meta";

export const dynamic = "force-static";
export const revalidate = 86400;

const SITE_URL = "https://simnetiq.store";

function renderService(s: Service): string {
  const fullTitle = getServiceFullTitle(s);
  const url = `${SITE_URL}/en/services/${s.slug}`;

  const subServices = s.services
    .map((sv) => `- **${sv.code} · ${sv.title}** — ${sv.text}`)
    .join("\n");

  const techStack = s.techStack
    .map((g) => `- **${g.label}**: ${g.items.join(", ")}`)
    .join("\n");

  const pricing = s.pricing
    .map((p) => {
      const sub = p.sub ? ` (${p.sub})` : "";
      const bullets = p.bullets.map((b) => `  - ${b}`).join("\n");
      return `### ${p.name} — ${p.price}${sub}\n${p.blurb}\n${bullets}`;
    })
    .join("\n\n");

  const meta = s.meta.map((m) => `- **${m.label}**: ${m.value}`).join("\n");

  return `## ${fullTitle} (${s.code})
URL: ${url}
Badge: ${s.badge}
Tagline: ${s.tagline}

${s.summary}

${s.positioning}

### Sub-services
${subServices}

### Tech stack
${techStack}

### Pricing tiers
${pricing}

### Meta
${meta}
`;
}

function buildLlmsFullTxt(): string {
  const services = getServices("en");
  const home = ROUTE_COPY.home.en;
  const about = ROUTE_COPY.about.en;
  const projects = ROUTE_COPY.projects.en;
  const servicesCopy = ROUTE_COPY.services.en;
  const doppler = ROUTE_COPY.caseStudyDoppler.en;
  const physics = ROUTE_COPY.caseStudyPhysics.en;

  const servicesSection = services.map(renderService).join("\n---\n\n");

  return `# Simnetiq — Full Content (llms-full.txt)

> Inlined content of every primary page on simnetiq.store, in Markdown, for single-fetch consumption by AI agents.
> Canonical site: ${SITE_URL}/en
> Last generated: ${new Date().toISOString().slice(0, 10)}
> See also: ${SITE_URL}/llms.txt (index) and ${SITE_URL}/sitemap.xml

---

# Home

URL: ${SITE_URL}/en
Title: ${home.title}

${home.description}

Simnetiq is a small London studio of three owner-operators. We deliver software end-to-end: native mobile and desktop apps, web platforms, AI features and pipelines, paid acquisition campaigns wired to real attribution, and bespoke VPN infrastructure. Each engagement is scoped, priced in GBP, and signed as a SOW before code is written.

## Live deployments referenced from the homepage

- **Doppler VPN** (https://dopplervpn.org) — Custom VLESS-Reality VPN with zero-log geo-distributed nodes. Native iOS and Android clients.
- **Physics.explained** (https://physics.it.com/) — Open-source interactive physics learning platform with accurate ODE solvers and a concepts dictionary.
- **Creator AI** (https://www.creatorai.art/en) — Neural content synthesis platform. Multi-language editorial pipelines on Anthropic and OpenAI.
- **Go Delivery / ISR Shipping** (https://www.isrshipping.com) — Logistics platform with real-time GPS driver tracking, route optimisation and order lifecycle management.
- **Simnetiq eSIM** (${SITE_URL}) — eSIM platform with Supabase backend and Stripe billing. iOS and Android clients, admin console.

---

# About

URL: ${SITE_URL}/en/about
Title: ${about.title}

${about.description}

## Company registration

- **Legal name:** Simnetiq Ltd
- **Company number:** 16861177
- **Jurisdiction:** Registered in England & Wales
- **VAT status:** Not VAT-registered (under threshold)
- **Registered address:** Simnetiq Ltd, 2 Frederick Street, Kings Cross, London WC1X 0ND, United Kingdom
- **Founded:** 2025
- **Operations:** London, United Kingdom (51.5074°N · 0.1278°W)

## Team (three owner-operators)

01 — Director / Engineering — Roman Pochtman — Mobile, web, AI, infrastructure
02 — Director / Engineering — Dmitry Polskoy — Backend, automation, growth wiring
03 — Director / Legal & Operations — David Zitomirsky — Contracts, compliance, finance

## Operating principles

- Every engagement priced in GBP against a signed SOW. No retainers without a defined deliverable.
- Production-first: we write the code that survives in production, not demoware.
- Owner-operator delivery: the people you brief are the people who write and ship the code.
- Observability and CI/CD shipped from day one of every project.
- Native where it matters; cross-platform where it doesn't.

---

# Services

URL: ${SITE_URL}/en/services
Title: ${servicesCopy.title}

${servicesCopy.description}

${servicesSection}

---

# Projects

URL: ${SITE_URL}/en/projects
Title: ${projects.title}

${projects.description}

## Doppler VPN

URL: ${SITE_URL}/en/projects/doppler-vpn
Live: https://dopplervpn.org
Title: ${doppler.title}

${doppler.description}

Stack: Swift (iOS), Kotlin (Android), Go (server), Marzban control plane, VLESS-Reality protocol.
Status: Production. Native apps on iOS, Android, macOS and Windows. Card and crypto payments. No registration, no logs.

## Physics.explained

URL: ${SITE_URL}/en/projects/physics-explained
Live: https://physics.it.com
Title: ${physics.title}

${physics.description}

Stack: Next.js, WebGL, MathJax, custom unit-tested ODE solvers, AI tutor (Anthropic Claude) at /ask.
Status: Open-source. Live encyclopedia spanning classical mechanics, electromagnetism, thermodynamics, relativity, quantum and modern physics.

## Creator AI

URL: https://www.creatorai.art/en
Status: Production. Multi-language LLM content platform on Anthropic and OpenAI. Native iOS and Android clients, dedicated Supabase backend.
Stack: Swift, Kotlin, Python, Supabase.

## Go Delivery / ISR Shipping

URL: https://www.isrshipping.com
Status: Production. Israeli logistics platform with real-time GPS driver tracking, route optimisation, and order lifecycle management.
Stack: Next.js, React, Node.js, PostgreSQL.

---

# Contact & booking

- **Book an intro call:** Cal.com widget on ${SITE_URL}/en
- **Registered office:** Simnetiq Ltd, 2 Frederick Street, Kings Cross, London WC1X 0ND, United Kingdom
- **Companies House:** 16861177 (England & Wales)
- **Languages served:** English (en-GB), Hebrew (he-IL)

---

# Machine-readable references

- Index for AI agents: ${SITE_URL}/llms.txt
- Full content (this file): ${SITE_URL}/llms-full.txt
- XML sitemap: ${SITE_URL}/sitemap.xml
- robots.txt: ${SITE_URL}/robots.txt
`;
}

export async function GET() {
  return new Response(buildLlmsFullTxt(), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
