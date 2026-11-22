import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Inter, Lunasima } from "next/font/google";
import "../globals.css";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { CookieConsent } from "@/components/cookie-consent";
import { GlobalStructuredData } from "@/components/structured-data";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeInitScript } from "@/components/theme-init-script";
import { getDictionary } from "@/lib/dictionaries";
import {
  LOCALES,
  LOCALE_HTML_LANG,
  getDirection,
  isLocale,
  localizePath,
  type Locale,
} from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-inter",
});

// Hebrew face for the he locale and the locale switcher's Hebrew label. Not
// preloaded: a root-layout preload is emitted for every locale, and en/ru
// pages need it for two glyphs at most. The browser fetches the subsets it
// needs through unicode-range.
const lunasima = Lunasima({
  subsets: ["latin", "hebrew"],
  weight: ["400", "700"],
  variable: "--font-lunasima",
  preload: false,
});

// Project reference fonts (Bricolage, JetBrains Mono, Instrument Serif, Rubik,
// Geist, Geist Mono, Cormorant) are loaded by projects/<slug>/layout.tsx.

const SITE_NAME = "Simnetiq";
const DEFAULT_TITLE = "Simnetiq — London Software Engineering Studio";
const DEFAULT_DESCRIPTION =
  "Simnetiq is a London-based technology studio. We design and engineer iOS and Android apps, Next.js web platforms, AI/LLM systems and VPN infrastructure. Full-stack development, App Store and Google Play submission — from brief to production.";

const KEYWORDS = [
  "Simnetiq",
  "Simnetiq Ltd",
  "Simnetiq London",
  "Simnetiq technology studio",
  "software development agency London",
  "software engineering studio London",
  "product studio London",
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
  "AI integration agency",
  "LLM engineering London",
  "Anthropic Claude integration",
  "OpenAI API integration",
  "RAG pipeline development",
  "pgvector consulting",
  "agentic automation development",
  "AI product engineering UK",
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
  "logistics platform development",
  "Doppler VPN",
  "Creator AI",
  "Physics.explained",
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
  classification: "Software Engineering Studio",
  alternates: {
    canonical: `${SITE_URL}/en`,
    languages: {
      "en-GB": `${SITE_URL}/en`,
      "he-IL": `${SITE_URL}/he`,
      "ru-RU": `${SITE_URL}/ru`,
      "x-default": `${SITE_URL}/en`,
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
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Simnetiq — London Software Engineering Studio",
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
    images: ["/opengraph-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "48x48", type: "image/png" },
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
    "msapplication-TileColor": "#07090D",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#07090D" },
    { media: "(prefers-color-scheme: light)", color: "#F7F5F1" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

type Params = Promise<{ locale: string }>;

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Params;
}>) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dir = getDirection(locale);
  const dict = await getDictionary(locale);

  // The theme is NOT read here: cookies() would make every route under this
  // layout render per request. ThemeInitScript reads the theme-pref cookie /
  // localStorage in the browser and writes data-theme, data-theme-choice and
  // color-scheme onto <html> before first paint; suppressHydrationWarning
  // covers those script-written attributes.
  return (
    <html
      lang={LOCALE_HTML_LANG[locale]}
      dir={dir}
      className={`${inter.variable} ${lunasima.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans antialiased">
        {/* Inline, blocking, synchronous. Must be the first <body> child so
            the browser parses + executes it before any other body content
            is laid out — that's what eliminates the dark→light flash on
            cold loads. Cannot use next/script beforeInteractive: the App
            Router routes those through __next_s, which dispatches
            asynchronously after the runtime boots, by which time the
            page has already painted.

            ThemeInitScript wraps the raw <script> in a server-only render
            so React 19 doesn't reconcile it during client navigation
            (which would log "Scripts inside React components are never
            executed when rendering on the client"). */}
        <ThemeInitScript />
        <ThemeProvider>
          <GlobalStructuredData />
          <Navigation
            locale={locale}
            dict={{
              ...dict.nav,
              dropdowns: {
                projects: {
                  eyebrow: dict.projects.eyebrow,
                  cta: dict.nav.dropdowns.projects.cta,
                  items: dict.projects.items,
                },
                services: {
                  eyebrow: dict.capabilities.eyebrow,
                  cta: dict.capabilities.viewService,
                  items: dict.capabilities.items,
                },
              },
            }}
          />
          <main className="flex-1">{children}</main>
          <Footer locale={locale} dict={dict.footer} themeLabels={dict.nav.themes} />
          {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ? (
            <CookieConsent
              gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
              privacyHref={localizePath(locale, "/privacy-policy")}
              labels={dict.common.cookieConsent}
            />
          ) : null}
        </ThemeProvider>
      </body>
    </html>
  );
}
