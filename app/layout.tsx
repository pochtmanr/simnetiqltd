import type { Metadata, Viewport } from "next";
import {
  Inter,
  Space_Grotesk,
  JetBrains_Mono,
  Instrument_Serif,
  Rubik,
} from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { GlobalStructuredData } from "@/components/structured-data";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
});

// Doppler reference fonts — used on /projects/doppler-vpn design-system section.
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
});

const rubik = Rubik({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-rubik",
});

const SITE_URL = "https://simnetiq.store";
const SITE_NAME = "Simnetiq";
const DEFAULT_TITLE = "Simnetiq — London Software Engineering & Growth Marketing Studio";
const DEFAULT_DESCRIPTION =
  "Simnetiq is a London-based technology studio. We design, engineer and market iOS and Android apps, Next.js web platforms, AI/LLM systems and VPN infrastructure. Full-stack development, growth marketing, App Store and Google Play submission — from brief to production.";

const KEYWORDS = [
  "Simnetiq",
  "Simnetiq Ltd",
  "Simnetiq London",
  "Simnetiq technology studio",
  "software development agency London",
  "software engineering studio London",
  "product studio London",
  "development and marketing agency London",
  "full-stack development agency UK",
  "mobile app developers London",
  "iOS app development London",
  "Android app development London",
  "SwiftUI developer UK",
  "Jetpack Compose developer UK",
  "Kotlin development agency",
  "Swift development agency",
  "React Native developers London",
  "Flutter developers UK",
  "cross-platform app development",
  "desktop app development UK",
  "macOS app development",
  "Windows app development WinUI",
  "Next.js agency London",
  "Next.js 16 development",
  "React 19 development",
  "TypeScript development agency",
  "SaaS development London",
  "Stripe integration experts",
  "Supabase development agency",
  "web development agency UK",
  "landing page design London",
  "marketing website development",
  "AI integration agency",
  "LLM engineering London",
  "Anthropic Claude integration",
  "OpenAI API integration",
  "RAG pipeline development",
  "pgvector consulting",
  "agentic automation development",
  "AI product engineering UK",
  "growth marketing agency London",
  "paid acquisition agency UK",
  "Meta ads agency",
  "TikTok ads agency",
  "Google Ads management agency",
  "Apple Search Ads agency",
  "AppsFlyer integration experts",
  "Adjust integration experts",
  "mobile measurement partner setup",
  "App Store optimisation agency",
  "ASO agency London",
  "app store submission service",
  "Google Play submission service",
  "VPN development agency",
  "VPN infrastructure engineering",
  "VLESS Reality protocol",
  "Marzban VPN deployment",
  "network engineering studio",
  "n8n automation agency",
  "Telegram bot development",
  "Stripe Billing integration",
  "RevenueCat integration agency",
  "eSIM platform development",
  "logistics platform development",
  "Doppler VPN",
  "Creator AI",
  "Physics.explained",
  "Simnetiq eSIM",
];

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: "%s — Simnetiq",
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  authors: [
    { name: "Simnetiq Ltd", url: SITE_URL },
    { name: "Roman Pochtman" },
  ],
  creator: "Simnetiq Ltd",
  publisher: "Simnetiq Ltd",
  keywords: KEYWORDS,
  referrer: "origin-when-cross-origin",
  category: "technology",
  classification: "Software Engineering & Marketing Studio",
  alternates: {
    canonical: SITE_URL,
    languages: {
      "en-GB": SITE_URL,
      "x-default": SITE_URL,
    },
  },
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Simnetiq — Technology Studio",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    creator: "@simnetiq",
    site: "@simnetiq",
    images: ["/icon-512.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "105x103", type: "image/png" },
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: "google49bde5c9488a3ae1",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  other: {
    "theme-color": "#07090D",
    "msapplication-TileColor": "#07090D",
  },
};

export const viewport: Viewport = {
  themeColor: "#07090D",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GB"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} ${rubik.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans antialiased">
        <GlobalStructuredData />
        <Navigation />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
