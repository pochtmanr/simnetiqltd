import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { notFound } from "next/navigation";
import { ServiceFigure, type ServiceCode } from "@/components/service-figure";
import { TechnologyChips } from "@/components/technology-chips";
import { CardArrow } from "@/components/sections/card-arrow";
import { ServiceWork, ServiceContact } from "@/components/service-page-sections";
import styles from "@/components/services.module.css";
import { getServices } from "@/lib/services";
import { BreadcrumbSchema } from "@/components/structured-data";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, localizePath, type Locale } from "@/lib/i18n";
import { buildLocalizedMetadata } from "@/lib/seo-meta";
import { SITE_URL } from "@/lib/site";

const SERVICE_TECHNOLOGIES: Record<string, string[]> = {
  "mobile-desktop": ["iOS", "Android", "macOS", "Windows", "Linux"],
  "web-platforms": ["Next.js", "React", "Supabase", "Stripe Billing", "TypeScript"],
  "ai-automation": ["Anthropic Claude", "OpenAI", "n8n", "Make", "Python"],
};

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
    markdownAlternate: true,
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
          { name: dict.nav.links.home, url: `${SITE_URL}/${locale}` },
          { name: dict.nav.links.services, url: `${SITE_URL}/${locale}/services` },
        ]}
      />
      <PageHeader title={s.titleLine1} subtitle={s.titleLine2} description={s.body} />
      <section className={`${styles.container} ${styles.directory}`} aria-label={s.eyebrow}>
        {services.map((service, index) => {
          const figure: ServiceCode = service.slug === "mobile-desktop" ? "mobile" : service.slug === "web-platforms" ? "web" : "aiAutomation";
          return <article key={service.slug} id={service.slug} className={`${styles.serviceRow} scroll-mt-28`}>
            <div className={styles.rowVisual}>
              <span className={styles.number}>0{index + 1}</span>
              <ServiceFigure animated code={figure} className={styles.rowFigure} />
            </div>
            <div>
              <h2 className={styles.rowTitle}><Link href={localizePath(locale, `/services/${service.slug}`)}>{service.title} <span>{service.titleSecondary}</span></Link></h2>
              <p className={`text-body ${styles.rowDescription}`}>{service.summary}</p>
            </div>
            <div className={styles.rowAside}>
              <TechnologyChips technologies={SERVICE_TECHNOLOGIES[service.slug]} label={dict.serviceDetail.stack.title} />
              <Link href={localizePath(locale, `/services/${service.slug}`)} className={styles.textLink}>{s.viewBrief}<CardArrow /></Link>
            </div>
          </article>;
        })}
      </section>
      <ServiceWork locale={locale} dict={dict} />
      <ServiceContact locale={locale} dict={dict} />
    </>
  );
}
