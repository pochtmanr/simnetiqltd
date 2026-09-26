import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomePageClient } from "@/components/home-page-client";
import { PortfolioSchema } from "@/components/structured-data";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";
import { buildLocalizedMetadata } from "@/lib/seo-meta";

const HOME_KEYWORDS = [
  "Simnetiq",
  "Simnetiq Ltd",
  "Simnetiq London",
  "London software development studio",
  "London software engineering studio",
  "London app development agency",
  "UK software studio",
  "UK mobile app agency",
  "UK product studio",
  "Next.js agency London",
  "Next.js 16 agency",
  "Supabase development London",
  "Stripe integration London",
  "iOS app development London",
  "SwiftUI agency London",
  "Android app development London",
  "Jetpack Compose agency",
  "AI integration agency UK",
  "LLM engineering London",
  "Anthropic Claude consultancy",
  "OpenAI integration agency",
  "RAG pipeline development",
  "agentic automation UK",
  "VPN infrastructure engineering",
  "VLESS Reality VPN development",
  "Marzban VPN agency",
  "SaaS platform builder UK",
  "Telegram bot agency",
  "n8n automation agency",
  "Doppler VPN",
  "Creator AI",
  "Physics.explained",
  "hire app developers London",
  "hire Next.js developers",
  "hire Swift developers",
  "hire Kotlin developers",
  "indie app studio London",
  "high-integrity software studio",
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? (rawLocale as Locale) : "en";
  return buildLocalizedMetadata({
    locale,
    routeKey: "home",
    path: "",
    keywords: HOME_KEYWORDS,
    markdownAlternate: true,
  });
}

// Mirrors the card order in components/sections/recent-work-section.tsx.
// Both this and the /projects page emit an ItemList under the same @id, so the
// two must agree — they drifted once already, when SMS Activate, VisaPassage
// and Green Flagged were added to the cards but not to this list.
const portfolioItems = [
  {
    name: "Argus Browser",
    url: "https://www.browserargus.com/",
    description:
      "Anti-detect browser built on a custom Chromium fork, with a desktop control plane for profiles, proxies, automations, schedules and datasets.",
  },
  {
    name: "Physics.explained",
    url: "https://physics.it.com/",
    description:
      "Open-source interactive physics learning platform with accurate ODE solvers and a concepts dictionary.",
  },
  {
    name: "Doppler VPN",
    url: "https://dopplervpn.org",
    description:
      "Custom VLESS-Reality VPN with zero-log geo-distributed nodes. Native iOS and Android clients.",
  },
  {
    name: "SMS Code by SIMNETIQ",
    url: "https://simnetiq.xyz/",
    description:
      "Virtual numbers for sign-up verification. Real carrier numbers in 150+ countries across 100+ services, with codes in about thirty seconds. Web and iOS.",
  },
  {
    name: "VisaPassage",
    url: "https://visapassage.com/",
    description:
      "Multi-passport visa intelligence. Compare visa routes across every passport and residency you hold from one encrypted profile.",
  },
  {
    name: "Green Flagged",
    url: "https://greenflagged.vercel.app/",
    description:
      "AI contract reviewer for freelancers and small teams. Drop a PDF, get a plain-language verdict with flagged clauses, severity grades and suggested redlines.",
  },
  {
    name: "Go Delivery (ISR Shipping)",
    url: "https://www.isrshipping.com",
    description:
      "Logistics platform with real-time GPS driver tracking, route optimisation and order lifecycle management.",
  },
  {
    name: "Creator AI",
    url: "https://www.creatorai.art/en",
    description:
      "Neural content synthesis platform. Multi-language editorial pipelines on Anthropic and OpenAI.",
  },
];

type Params = Promise<{ locale: string }>;

export default async function HomePage({ params }: { params: Params }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);

  return (
    <>
      <PortfolioSchema items={portfolioItems} />
      <HomePageClient locale={locale} dict={dict} />
    </>
  );
}
