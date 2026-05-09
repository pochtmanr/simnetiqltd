import { getServices, getServiceFullTitle } from "@/lib/services";

export const dynamic = "force-static";
export const revalidate = 86400;

const SITE_URL = "https://simnetiq.store";

function buildLlmsTxt(): string {
  const services = getServices("en");

  const serviceLinks = services
    .map((s) => {
      const title = getServiceFullTitle(s);
      return `- [${title}](${SITE_URL}/en/services/${s.slug}): ${s.tagline}`;
    })
    .join("\n");

  return `# Simnetiq

> Simnetiq Ltd is a London-based software engineering and growth marketing studio. We build production iOS, Android, macOS, Windows and Linux applications; Next.js / Supabase / Stripe web platforms; LLM, RAG and agentic automation on Anthropic, OpenAI and open-weight models; paid acquisition on Meta, TikTok and Google wired to AppsFlyer and Adjust attribution; and censorship-resistant VPN infrastructure on VLESS-Reality. Three owner-operators, registered in England & Wales (Companies House 16861177), 2 Frederick Street, Kings Cross, London WC1X 0ND.

Every engagement is priced in GBP against a signed SOW. Brief to production, end-to-end. No agency retainers, no black-box reporting.

## Services

${serviceLinks}

## Projects

- [Doppler VPN](${SITE_URL}/en/projects/doppler-vpn): Censorship-resistant VPN on VLESS-Reality with native iOS, Android, macOS and Windows clients. Zero-log, zero-registration, indistinguishable from HTTPS.
- [Physics.explained](${SITE_URL}/en/projects/physics-explained): Open-source interactive physics encyclopedia with unit-tested ODE solvers, WebGL visualisations and an AI tutor at /ask grounded in the library.
- [Creator AI](https://www.creatorai.art/en): Multi-language LLM content platform on Anthropic and OpenAI. Editorial pipelines, native iOS and Android clients.
- [Go Delivery / ISR Shipping](https://www.isrshipping.com): Logistics platform with real-time GPS driver tracking, route optimisation and full order lifecycle management.
- [Simnetiq eSIM](${SITE_URL}/en): eSIM platform with Supabase backend, Stripe billing, iOS and Android clients, admin console.

## Company

- [About Simnetiq](${SITE_URL}/en/about): Founders, registration, registered address and operating principles.
- [Services overview](${SITE_URL}/en/services): Four service lines with pricing tiers and tech stacks.
- [Projects index](${SITE_URL}/en/projects): Production deployments and case studies.

## Contact

- Registered office: Simnetiq Ltd, 2 Frederick Street, Kings Cross, London WC1X 0ND, United Kingdom
- Companies House: 16861177 (England & Wales)
- Booking: ${SITE_URL}/en — book an intro call via Cal.com on the homepage

## Optional

- [Legal notice](${SITE_URL}/en/legal)
- [Privacy policy](${SITE_URL}/en/privacy-policy)
- [Hebrew (he-IL) version](${SITE_URL}/he)
- [llms-full.txt](${SITE_URL}/llms-full.txt): Full inlined content for single-fetch consumption.
- [Sitemap](${SITE_URL}/sitemap.xml)
`;
}

export async function GET() {
  return new Response(buildLlmsTxt(), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
