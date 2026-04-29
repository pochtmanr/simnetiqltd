import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomePageClient } from "@/components/home-page-client";
import { PortfolioSchema } from "@/components/structured-data";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";
import { buildLocalizedMetadata } from "@/lib/seo-meta";

const SITE_URL = "https://simnetiq.store";

const HOME_KEYWORDS = [
  "Simnetiq",
  "Simnetiq Ltd",
  "Simnetiq London",
  "London software development studio",
  "London software engineering studio",
  "London app development agency",
  "London growth marketing agency",
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
  "paid acquisition agency London",
  "Meta ads agency UK",
  "TikTok ads agency UK",
  "Google Ads agency London",
  "AppsFlyer integration agency",
  "Adjust integration agency",
  "App Store optimisation London",
  "SaaS platform builder UK",
  "Telegram bot agency",
  "n8n automation agency",
  "Doppler VPN",
  "Creator AI",
  "Physics.explained",
  "Simnetiq eSIM",
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
  });
}

const portfolioItems = [
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
    name: "Creator AI",
    url: "https://www.creatorai.art/en",
    description:
      "Neural content synthesis platform. Multi-language editorial pipelines on Anthropic and OpenAI.",
  },
  {
    name: "Go Delivery (ISR Shipping)",
    url: "https://www.isrshipping.com",
    description:
      "Logistics platform with real-time GPS driver tracking, route optimisation and order lifecycle management.",
  },
  {
    name: "Simnetiq eSIM",
    url: "https://simnetiq.store",
    description:
      "eSIM platform with Supabase backend and Stripe billing. iOS and Android clients, admin console.",
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
