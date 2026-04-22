import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel, Rail, SpecRow } from "@/components/panel";
import {
  getAllServiceSlugs,
  getService,
  services,
} from "@/lib/services";
import {
  BreadcrumbSchema,
  ServiceSchema,
} from "@/components/structured-data";

const SITE_URL = "https://simnetiq.store";

const slugKeywords: Record<string, string[]> = {
  "mobile-desktop": [
    "mobile app development London",
    "iOS app development agency London",
    "Android app development agency UK",
    "SwiftUI app developers",
    "Jetpack Compose app developers",
    "Kotlin app development agency",
    "Swift development agency London",
    "cross-platform app development UK",
    "React Native agency London",
    "Flutter agency UK",
    "macOS app development studio",
    "Windows app development WinUI 3",
    "Linux desktop app development",
    "Tauri app development",
    "Electron app development agency",
    "App Store submission service",
    "Google Play submission service",
    "TestFlight management",
    "RevenueCat integration",
    "StoreKit integration",
    "Google Play Billing integration",
    "mobile app MVP development London",
    "production-grade mobile apps",
    "hire iOS developer London",
    "hire Android developer London",
    "hire SwiftUI developer",
    "hire Jetpack Compose developer",
  ],
  "growth-marketing": [
    "growth marketing agency London",
    "paid acquisition agency UK",
    "performance marketing agency London",
    "app marketing agency London",
    "mobile app marketing agency UK",
    "Meta ads management agency",
    "Facebook ads agency London",
    "Instagram ads agency UK",
    "TikTok ads agency London",
    "TikTok Spark Ads agency",
    "Google Ads agency London",
    "Google UAC agency",
    "Apple Search Ads agency",
    "AppsFlyer integration agency",
    "Adjust integration agency",
    "Branch SDK integration",
    "MMP setup agency",
    "mobile attribution setup",
    "deep linking setup",
    "App Store Optimisation agency",
    "ASO London",
    "LTV modelling agency",
    "payback modelling agency",
    "creative production for ads London",
    "UGC ad creative agency",
    "Server-side GTM agency",
    "Meta Conversions API setup",
    "TikTok Events API setup",
    "growth retainer London",
  ],
  "ai-integration": [
    "AI integration agency London",
    "LLM engineering agency",
    "LLM integration consultancy UK",
    "Anthropic Claude integration",
    "Claude API consultancy",
    "OpenAI integration agency",
    "GPT integration agency UK",
    "RAG pipeline development",
    "retrieval augmented generation agency",
    "pgvector consulting",
    "Pinecone integration",
    "Weaviate integration",
    "agentic automation agency",
    "agent orchestration London",
    "LangGraph development agency",
    "Claude Agent SDK consultancy",
    "AI feature engineering London",
    "prompt engineering consultancy",
    "prompt caching implementation",
    "LLM evaluation harness",
    "Braintrust consulting",
    "Langfuse setup",
    "AI product studio UK",
    "voice AI agency",
    "Whisper Deepgram integration",
    "ElevenLabs integration",
    "AI fine-tuning LoRA UK",
    "Llama self-hosting consultancy",
    "Mistral deployment consultancy",
    "hire AI engineer London",
  ],
  "web-platforms": [
    "web development agency London",
    "Next.js agency London",
    "Next.js 16 development agency",
    "React 19 agency UK",
    "TypeScript development agency",
    "Tailwind v4 agency",
    "shadcn/ui agency",
    "HeroUI agency",
    "Supabase development agency",
    "Supabase consultancy UK",
    "PostgreSQL consulting London",
    "Drizzle ORM agency",
    "Prisma agency",
    "Stripe Billing integration",
    "Stripe Connect integration agency",
    "subscription billing agency",
    "RevenueCat web integration",
    "Apple IAP integration",
    "Google Play Billing integration",
    "SaaS development agency London",
    "multi-tenant SaaS development",
    "SSO integration agency",
    "Sign in with Apple setup",
    "Passkeys WebAuthn integration",
    "Clerk integration agency",
    "landing page design London",
    "marketing website development",
    "admin dashboard development",
    "internal tools development",
    "n8n workflow agency",
    "Telegram bot development agency",
    "Slack app development agency",
    "Resend transactional email setup",
    "Vercel deployment consultancy",
    "Cloudflare Pages agency",
    "Hostinger VPS consulting",
  ],
};

const slugPriceFrom: Record<string, string> = {
  "mobile-desktop": "1000",
  "growth-marketing": "500",
  "ai-integration": "500",
  "web-platforms": "800",
};

export function generateStaticParams() {
  return getAllServiceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return { title: "Service" };
  const url = `${SITE_URL}/services/${slug}`;
  const title = `${service.title} — ${service.tagline}`;
  const description = service.summary;
  return {
    title,
    description,
    keywords: slugKeywords[slug] ?? [],
    alternates: { canonical: url },
    openGraph: {
      title: `${service.title} — Simnetiq`,
      description,
      url,
      siteName: "Simnetiq",
      type: "website",
      locale: "en_GB",
    },
    twitter: {
      card: "summary_large_image",
      title: `${service.title} — Simnetiq`,
      description,
    },
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const currentIndex = services.findIndex((s) => s.slug === slug);
  const next = services[(currentIndex + 1) % services.length];
  const prev =
    services[(currentIndex - 1 + services.length) % services.length];

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: `${SITE_URL}/` },
          { name: "Services", url: `${SITE_URL}/services` },
          { name: service.title, url: `${SITE_URL}/services/${service.slug}` },
        ]}
      />
      <ServiceSchema
        name={service.title}
        slug={service.slug}
        summary={service.summary}
        serviceTypes={slugKeywords[service.slug]}
        priceFrom={slugPriceFrom[service.slug]}
      />
      {/* ============================================================ */}
      {/* HERO (split)                                                  */}
      {/* ============================================================ */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 pt-12 lg:pt-20 pb-14 lg:pb-20">
          <Rail
            items={[
              `◆ SIMNETIQ / 02 / ${service.code}`,
              service.badge,
              "CAPABILITY BRIEF",
            ]}
            className="mb-10"
          />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-4 mb-5">
                <span className="text-mono text-[var(--color-text-faint)]">
                  {service.code}
                </span>
                <span className="h-3 w-px bg-[var(--color-border-strong)]" />
                <span className="text-label-sm text-[var(--color-primary-glow)]">
                  {service.badge}
                </span>
              </div>
              <h1 className="text-display">
                {service.title}
              </h1>
              <p className="text-headline text-[var(--color-text-dim)] mt-4 normal-case tracking-normal" style={{ fontWeight: 300, letterSpacing: "-0.01em" }}>
                {service.tagline}
              </p>
              <p className="text-body mt-8 max-w-2xl">{service.summary}</p>
            </div>
            <div className="lg:col-span-4">
              <Panel innerClassName="p-5">
                <p className="text-label-sm text-[var(--color-text-faint)] mb-4">
                  ▸ Brief
                </p>
                {service.meta.map((m) => (
                  <SpecRow key={m.label} label={m.label} value={m.value} />
                ))}
              </Panel>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* POSITIONING + SERVICES                                        */}
      {/* ============================================================ */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <p className="text-label text-[var(--color-primary-glow)]">
                ◇ Scope
              </p>
              <h2 className="text-headline mt-5">Services</h2>
              <p className="text-body mt-6 max-w-sm">
                {service.positioning}
              </p>
            </div>
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {service.services.map((item) => (
                <Panel key={item.code} innerClassName="p-6 h-full" corners>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-mono text-[var(--color-text-faint)]">
                      {item.code}
                    </span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary-glow)]" />
                  </div>
                  <h3 className="text-title mb-3">{item.title}</h3>
                  <p className="text-body">{item.text}</p>
                </Panel>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* TECH STACK                                                    */}
      {/* ============================================================ */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-10">
            <div className="lg:col-span-4">
              <p className="text-label text-[var(--color-primary-glow)]">
                ◇ Instrumentation
              </p>
              <h2 className="text-headline mt-5">Technology stack</h2>
            </div>
            <div className="lg:col-span-6 lg:col-start-7 self-end">
              <p className="text-body max-w-md">
                The full surface we deploy across this capability. Chosen per
                project — not every tool fits every brief.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {service.techStack.map((group, i) => (
              <Panel key={group.label} innerClassName="p-6 h-full">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-mono text-[var(--color-text-faint)]">
                    T-{String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-label-sm text-[var(--color-text-dim)]">
                    {group.items.length} items
                  </span>
                </div>
                <h3 className="text-title mb-5">{group.label}</h3>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="text-label-sm text-[var(--color-text-dim)] border border-[var(--color-border-strong)] px-3 py-1.5"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </Panel>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* PRICING                                                       */}
      {/* ============================================================ */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-10">
            <div className="lg:col-span-5">
              <p className="text-label text-[var(--color-primary-glow)]">
                ◇ Engagement
              </p>
              <h2 className="text-headline mt-5">Pricing</h2>
            </div>
            <div className="lg:col-span-6 lg:col-start-7 self-end">
              <p className="text-body max-w-md">
                Starting ranges in GBP. Final quotes depend on scope, timeline,
                and support level. Every engagement is a signed SOW with fixed
                milestones.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {service.pricing.map((tier, i) => (
              <Panel
                key={tier.name}
                innerClassName={`p-6 lg:p-8 h-full flex flex-col ${
                  tier.highlighted
                    ? "border-t-2 border-[var(--color-primary)]"
                    : ""
                }`}
                corners
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="text-mono text-[var(--color-text-faint)]">
                    TIER · 0{i + 1}
                  </span>
                  {tier.highlighted && (
                    <span className="text-label-sm text-[var(--color-primary-glow)]">
                      ◆ Recommended
                    </span>
                  )}
                </div>
                <h3 className="text-title mb-2">{tier.name}</h3>
                <p className="text-display mt-2" style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)" }}>
                  {tier.price}
                </p>
                {tier.sub && (
                  <p className="text-mono mt-2">{tier.sub}</p>
                )}
                <p className="text-body mt-4">{tier.blurb}</p>
                <div className="border-t border-[var(--color-border)] mt-6 pt-6 flex-1">
                  <ul className="space-y-3">
                    {tier.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-3 text-body">
                        <span className="mt-[9px] inline-block w-2 h-[1px] bg-[var(--color-primary-glow)] flex-shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/#contact"
                  className={
                    tier.highlighted ? "btn-primary mt-8" : "btn-secondary mt-8"
                  }
                >
                  Request brief →
                </Link>
              </Panel>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CTA + NAVIGATION                                              */}
      {/* ============================================================ */}
      <section>
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
            <div className="lg:col-span-7">
              <p className="text-label text-[var(--color-primary-glow)]">
                ◇ Contact Us
              </p>
              <h2 className="text-display mt-5" style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)" }}>
                Open a channel.
              </h2>
              <p className="text-body mt-6 max-w-lg">
                Briefs are reviewed within one working day. Tell us the
                objective, timeline, and constraints — we&apos;ll come back with
                a scope, price, and a plan.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/#contact" className="btn-primary">
                  Send brief →
                </Link>
                <Link href="/projects" className="btn-secondary">
                  View deployments
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <Link href={`/services/${prev.slug}`} className="block group">
                <Panel innerClassName="p-5 h-full">
                  <p className="text-mono text-[var(--color-text-faint)] mb-3">
                    ← Previous
                  </p>
                  <p className="text-label-sm text-[var(--color-text-dim)] mb-1">
                    {prev.code}
                  </p>
                  <p className="text-title">{prev.title}</p>
                </Panel>
              </Link>
              <Link href={`/services/${next.slug}`} className="block group">
                <Panel innerClassName="p-5 h-full text-right">
                  <p className="text-mono text-[var(--color-text-faint)] mb-3">
                    Next →
                  </p>
                  <p className="text-label-sm text-[var(--color-text-dim)] mb-1">
                    {next.code}
                  </p>
                  <p className="text-title">{next.title}</p>
                </Panel>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
