import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel, Rail, SpecRow } from "@/components/panel";
import {
  getAllServiceSlugs,
  getService,
  getServices,
} from "@/lib/services";
import {
  BreadcrumbSchema,
  ServiceSchema,
} from "@/components/structured-data";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, localizePath, type Locale } from "@/lib/i18n";

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
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale: Locale = isLocale(rawLocale) ? (rawLocale as Locale) : "en";
  const service = getService(slug, locale);
  if (!service) return { title: "Service" };
  const url = `${SITE_URL}/${locale}/services/${slug}`;
  const title = `${service.title} — ${service.tagline}`;
  const description = service.summary;
  return {
    title,
    description,
    keywords: slugKeywords[slug] ?? [],
    alternates: {
      canonical: url,
      languages: {
        "en-GB": `${SITE_URL}/en/services/${slug}`,
        "he-IL": `${SITE_URL}/he/services/${slug}`,
        "x-default": `${SITE_URL}/en/services/${slug}`,
      },
    },
    openGraph: {
      title: `${service.title} — Simnetiq`,
      description,
      url,
      siteName: "Simnetiq",
      type: "website",
      locale: locale === "he" ? "he_IL" : "en_GB",
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
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const service = getService(slug, locale);
  if (!service) notFound();

  const dict = await getDictionary(locale);
  const sd = dict.serviceDetail;
  const services = getServices(locale);
  const currentIndex = services.findIndex((s) => s.slug === slug);
  const next = services[(currentIndex + 1) % services.length];
  const prev =
    services[(currentIndex - 1 + services.length) % services.length];

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: `${SITE_URL}/${locale}` },
          { name: "Services", url: `${SITE_URL}/${locale}/services` },
          {
            name: service.title,
            url: `${SITE_URL}/${locale}/services/${service.slug}`,
          },
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
              sd.rail.indexTpl.replace("{code}", service.code),
              service.badge,
              sd.rail.brief,
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
                  {sd.brief}
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
                {sd.scope.eyebrow}
              </p>
              <h2 className="text-headline mt-5">{sd.scope.title}</h2>
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
                {sd.stack.eyebrow}
              </p>
              <h2 className="text-headline mt-5">{sd.stack.title}</h2>
            </div>
            <div className="lg:col-span-6 lg:col-start-7 self-end">
              <p className="text-body max-w-md">{sd.stack.body}</p>
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
                    {sd.stack.itemsCount.replace(
                      "{count}",
                      String(group.items.length)
                    )}
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
                {sd.pricing.eyebrow}
              </p>
              <h2 className="text-headline mt-5">{sd.pricing.title}</h2>
            </div>
            <div className="lg:col-span-6 lg:col-start-7 self-end">
              <p className="text-body max-w-md">{sd.pricing.body}</p>
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
                    {sd.pricing.tier.replace("{n}", String(i + 1))}
                  </span>
                  {tier.highlighted && (
                    <span className="text-label-sm text-[var(--color-primary-glow)]">
                      {sd.pricing.recommended}
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
                  href={localizePath(locale, "/#contact")}
                  className={
                    tier.highlighted ? "btn-primary mt-8" : "btn-secondary mt-8"
                  }
                >
                  {sd.pricing.requestBrief}
                  <span aria-hidden="true">→</span>
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
                {sd.cta.eyebrow}
              </p>
              <h2 className="text-display mt-5" style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)" }}>
                {sd.cta.title}
              </h2>
              <p className="text-body mt-6 max-w-lg">{sd.cta.body}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={localizePath(locale, "/#contact")} className="btn-primary">
                  {sd.cta.sendBrief}
                  <span aria-hidden="true">→</span>
                </Link>
                <Link href={localizePath(locale, "/projects")} className="btn-secondary">
                  {sd.cta.viewDeployments}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <Link href={localizePath(locale, `/services/${prev.slug}`)} className="block group">
                <Panel innerClassName="p-5 h-full">
                  <p className="text-mono text-[var(--color-text-faint)] mb-3">
                    {sd.cta.previous}
                  </p>
                  <p className="text-label-sm text-[var(--color-text-dim)] mb-1">
                    {prev.code}
                  </p>
                  <p className="text-title">{prev.title}</p>
                </Panel>
              </Link>
              <Link href={localizePath(locale, `/services/${next.slug}`)} className="block group">
                <Panel innerClassName="p-5 h-full text-right">
                  <p className="text-mono text-[var(--color-text-faint)] mb-3">
                    {sd.cta.next}
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
