import type { Metadata } from "next";
import Link from "next/link";
import { Panel, Rail } from "@/components/panel";
import { services } from "@/lib/services";
import { BreadcrumbSchema } from "@/components/structured-data";

const SITE_URL = "https://simnetiq.store";

export const metadata: Metadata = {
  title: "Services — Development, AI, Growth Marketing & Infrastructure",
  description:
    "Simnetiq services: iOS/Android/macOS/Windows/Linux app development; Next.js, Supabase and Stripe web platforms; AI and LLM integration across Anthropic and OpenAI; paid acquisition on Meta, TikTok and Google with AppsFlyer and Adjust attribution; VPN infrastructure. Every engagement priced in GBP against a signed SOW.",
  keywords: [
    "Simnetiq services",
    "software development services London",
    "software agency services UK",
    "mobile app development services London",
    "iOS development services London",
    "Android development services UK",
    "cross-platform app development services",
    "macOS Windows Linux app development",
    "desktop application development UK",
    "web development services London",
    "Next.js development services",
    "Next.js 16 development agency",
    "React development agency London",
    "Supabase development services",
    "Stripe integration services",
    "SaaS development services UK",
    "AI integration services",
    "LLM development services",
    "Anthropic Claude integration services",
    "OpenAI GPT integration services",
    "RAG development services",
    "agentic automation services",
    "growth marketing services London",
    "paid acquisition services UK",
    "Meta ads services London",
    "TikTok ads services",
    "Google Ads services London",
    "AppsFlyer integration services",
    "Adjust integration services",
    "App Store submission services",
    "Google Play submission services",
    "Telegram bot development services",
    "n8n automation services",
    "VPN development services",
    "fixed price software development UK",
    "SOW based software development",
  ],
  alternates: {
    canonical: `${SITE_URL}/services`,
  },
  openGraph: {
    title: "Services — Simnetiq Engineering & Marketing",
    description:
      "Four capability groups: Mobile & Desktop, Growth & Marketing, AI Integration, Web & Platforms. Fixed-scope SOW engagements in GBP.",
    url: `${SITE_URL}/services`,
    siteName: "Simnetiq",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Services — Simnetiq Engineering & Marketing",
    description:
      "Four capability groups: Mobile & Desktop, Growth & Marketing, AI Integration, Web & Platforms.",
  },
};

export default function ServicesIndexPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: `${SITE_URL}/` },
          { name: "Services", url: `${SITE_URL}/services` },
        ]}
      />
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 pt-12 lg:pt-20 pb-14 lg:pb-20">
          <Rail
            items={[
              "◆ SIMNETIQ / 02 / SERVICES",
              "CAPABILITY INDEX",
              `ENTRIES · 0${services.length}`,
            ]}
            className="mb-10"
          />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <p className="text-label text-[var(--color-primary-glow)]">
                ◇ Capabilities
              </p>
              <h1 className="text-display mt-6">
                <span className="block">Engineering</span>
                <span className="block text-[var(--color-text-dim)]">
                  Services
                </span>
              </h1>
            </div>
            <div className="lg:col-span-4 self-end">
              <p className="text-body max-w-sm">
                Four capability groups. Each with a defined scope, stack, and
                pricing tier — every engagement scoped against a signed SOW.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12 lg:py-20 space-y-6">
          {services.map((service) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="block group"
            >
              <Panel innerClassName="p-6 lg:p-10" corners>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
                  <div className="lg:col-span-3 flex lg:flex-col justify-between">
                    <span className="text-mono text-[var(--color-text-faint)]">
                      {service.code}
                    </span>
                    <span className="text-label-sm text-[var(--color-primary-glow)]">
                      {service.badge}
                    </span>
                  </div>
                  <div className="lg:col-span-6">
                    <h2 className="text-headline mb-3">{service.title}</h2>
                    <p className="text-body max-w-lg">{service.summary}</p>
                  </div>
                  <div className="lg:col-span-3 flex lg:flex-col lg:items-end lg:justify-between gap-3">
                    <div className="text-mono text-[var(--color-text-faint)]">
                      {service.services.length} services
                    </div>
                    <span className="text-label-sm text-[var(--color-text)] group-hover:text-[var(--color-primary-glow)] transition-colors">
                      View brief →
                    </span>
                  </div>
                </div>
              </Panel>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
