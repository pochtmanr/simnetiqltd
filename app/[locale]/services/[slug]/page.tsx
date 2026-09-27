import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ServiceFigure } from "@/components/service-figure";
import { TechnologyChips } from "@/components/technology-chips";
import { CardArrow } from "@/components/sections/card-arrow";
import { ServiceWork, ServiceContact } from "@/components/service-page-sections";
import styles from "@/components/services.module.css";
import {
  getAllServiceSlugs,
  getService,
  getServiceFullTitle,
  getServices,
} from "@/lib/services";
import {
  BreadcrumbSchema,
  ServiceSchema,
} from "@/components/structured-data";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, localizePath, type Locale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

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
  "ai-automation": [
    "AI automation agency London",
    "AI integration agency London",
    "LLM engineering agency",
    "n8n consultancy London",
    "n8n development agency UK",
    "Make.com automation agency",
    "Anthropic Claude integration",
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
    "AI pipeline consultancy",
    "self-hosted n8n VPS",
    "custom AI pipelines on VPS",
    "Telegram bot AI integration",
    "Stripe automation pipeline",
    "Supabase automation agency",
    "prompt engineering consultancy",
    "LLM evaluation harness",
    "Braintrust consulting",
    "Langfuse setup",
    "Whisper Deepgram integration",
    "ElevenLabs integration",
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
  const fullTitle = getServiceFullTitle(service);
  const title = fullTitle;
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
        "ru-RU": `${SITE_URL}/ru/services/${slug}`,
        "x-default": `${SITE_URL}/en/services/${slug}`,
      },
      types: {
        "text/markdown": `${url}/markdown`,
      },
    },
    openGraph: {
      title: `${fullTitle} — Simnetiq`,
      description,
      url,
      siteName: "Simnetiq",
      type: "website",
      locale: { en: "en_GB", he: "he_IL", ru: "ru_RU" }[locale],
    },
    twitter: {
      card: "summary_large_image",
      title: `${fullTitle} — Simnetiq`,
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

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: dict.nav.links.home, url: `${SITE_URL}/${locale}` },
          { name: dict.nav.links.services, url: `${SITE_URL}/${locale}/services` },
          {
            name: getServiceFullTitle(service),
            url: `${SITE_URL}/${locale}/services/${service.slug}`,
          },
        ]}
      />
      <ServiceSchema
        name={getServiceFullTitle(service)}
        slug={service.slug}
        summary={service.summary}
        serviceTypes={slugKeywords[service.slug]}
        locale={locale}
      />
      <section className={styles.hero}>
        <div className={`${styles.container} ${styles.heroGrid}`}>
          <div>
            <h1 className={styles.title}>{service.title}{" "}<span>{service.titleSecondary}</span></h1>
            <p className={styles.intro}>{service.summary}</p>
            <div className={styles.actions}>
              <Link href={localizePath(locale, "/#contact")} className="btn-primary">{sd.hero.ctaContact}<CardArrow /></Link>
              <Link href="#scope" className="btn-secondary">{sd.hero.ctaScope}<CardArrow /></Link>
            </div>
          </div>
          <ServiceFigure animated code={slug === "mobile-desktop" ? "mobile" : slug === "web-platforms" ? "web" : "aiAutomation"} className={styles.figure} />
        </div>
      </section>
      <section id="scope" className={`${styles.section} scroll-mt-24`}>
        <div className={`${styles.container} ${styles.scopeLayout}`}>
          <div className={styles.scopeIntro}>
            <h2 className="text-headline">{sd.scope.title}</h2>
            <p className="text-body">{service.positioning}</p>
          </div>
          <div className={styles.scopeGrid}>
            {service.services.map((item, i) => <article key={item.code} className={styles.scopeItem}>
              <span className={styles.number}>0{i + 1}</span>
              <h3>{item.title}</h3>
              <p className="text-body">{item.text}</p>
            </article>)}
          </div>
        </div>
      </section>
      <ServiceWork locale={locale} dict={dict} slug={slug} />
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className="text-headline">{sd.stack.title}</h2>
            <p className="text-body">{sd.stack.body}</p>
          </div>
          {service.techStack.map((group) => <div key={group.label} className={styles.stackRow}>
            <h3>{group.label}</h3>
            <TechnologyChips technologies={group.items} label={group.label} />
          </div>)}
        </div>
      </section>
      <ServiceContact locale={locale} dict={dict} related={services.filter((item) => item.slug !== slug)} />
    </>
  );
}
