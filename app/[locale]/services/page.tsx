import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel, Rail } from "@/components/panel";
import { getServices } from "@/lib/services";
import { BreadcrumbSchema } from "@/components/structured-data";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, localizePath, type Locale } from "@/lib/i18n";
import { buildLocalizedMetadata } from "@/lib/seo-meta";

const SITE_URL = "https://simnetiq.store";

const SERVICES_KEYWORDS = [
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
    routeKey: "services",
    path: "/services",
    keywords: SERVICES_KEYWORDS,
  });
}

type Params = Promise<{ locale: string }>;

export default async function ServicesIndexPage({
  params,
}: {
  params: Params;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);
  const s = dict.servicesIndex;
  const services = getServices(locale);

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: `${SITE_URL}/${locale}` },
          { name: "Services", url: `${SITE_URL}/${locale}/services` },
        ]}
      />
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 pt-12 lg:pt-20 pb-14 lg:pb-20">
          <Rail
            items={[
              s.rail.index,
              s.rail.capabilityIndex,
              s.rail.entries.replace("{count}", String(services.length)),
            ]}
            className="mb-10"
          />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <p className="text-label text-[var(--color-primary-glow)]">
                {s.eyebrow}
              </p>
              <h1 className="text-display mt-6">
                <span className="block">{s.titleLine1}</span>
                <span className="block text-[var(--color-text-dim)]">
                  {s.titleLine2}
                </span>
              </h1>
            </div>
            <div className="lg:col-span-4 self-end">
              <p className="text-body max-w-sm">{s.body}</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12 lg:py-20 space-y-6">
          {services.map((service) => (
            <Link
              key={service.slug}
              href={localizePath(locale, `/services/${service.slug}`)}
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
                      {s.servicesCount.replace(
                        "{count}",
                        String(service.services.length)
                      )}
                    </div>
                    <span className="text-label-sm text-[var(--color-text)] group-hover:text-[var(--color-primary-glow)] transition-colors">
                      {s.viewBrief}
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
