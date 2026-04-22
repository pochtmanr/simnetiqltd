import type { Metadata } from "next";
import { HomePageClient } from "@/components/home-page-client";
import { PortfolioSchema } from "@/components/structured-data";

const SITE_URL = "https://simnetiq.store";

const HOME_TITLE =
  "Simnetiq — London Software Engineering & Growth Marketing Studio";
const HOME_DESCRIPTION =
  "Simnetiq is a London technology studio: iOS, Android, macOS, Windows and Linux applications; Next.js and Supabase web platforms; LLM and RAG integration with Anthropic and OpenAI; paid acquisition across Meta, TikTok and Google wired to AppsFlyer and Adjust; VPN infrastructure. End-to-end brief to production.";

export const metadata: Metadata = {
  title: {
    absolute: HOME_TITLE,
  },
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: SITE_URL,
    type: "website",
    siteName: "Simnetiq",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
  keywords: [
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
  ],
};

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

export default function HomePage() {
  return (
    <>
      <PortfolioSchema items={portfolioItems} />
      <HomePageClient />
    </>
  );
}
