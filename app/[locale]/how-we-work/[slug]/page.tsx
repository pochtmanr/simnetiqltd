import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel, Rail, SpecRow } from "@/components/panel";
import {
  getAllHowWeWorkSlugs,
  getHowWeWork,
  getHowWeWorkEntry,
  getHowWeWorkFullTitle,
} from "@/lib/how-we-work";
import { BreadcrumbSchema, FaqSchema } from "@/components/structured-data";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, localizePath, type Locale } from "@/lib/i18n";
import { buildLocalizedMetadata, type RouteKey } from "@/lib/seo-meta";
import { SITE_URL } from "@/lib/site";

/**
 * Unlike /services/[slug] — whose title is derived from service data and so
 * hand-rolls its Metadata — these pages have dedicated SEO copy authored in
 * ROUTE_COPY, which lets them use the shared builder and inherit hreflang,
 * x-default, the OG card and the Markdown alternate for free.
 */
const ROUTE_KEY_BY_SLUG: Record<string, RouteKey> = {
  "work-directly-with-engineers": "howWeWorkEngineers",
  "fixed-price-scope": "howWeWorkScope",
  "code-ownership": "howWeWorkOwnership",
  "support-after-launch": "howWeWorkSupport",
};

const KEYWORDS_BY_SLUG: Record<string, string[]> = {
  "work-directly-with-engineers": [
    "work directly with developers",
    "software agency no account manager",
    "who actually builds my app",
    "talk to the engineer not a salesperson",
    "owner operator software studio",
    "small development studio London",
    "no junior handoff development agency",
    "two person software studio",
  ],
  "fixed-price-scope": [
    "fixed price software development UK",
    "software development statement of work",
    "fixed price vs time and materials",
    "SOW software development",
    "software project scope document",
    "fixed price app development London",
    "software change request pricing",
    "software development quote GBP",
    "discovery phase software project",
  ],
  "code-ownership": [
    "who owns the code when you hire an agency",
    "software IP ownership UK",
    "avoid vendor lock-in",
    "source code ownership development agency",
    "app store account ownership",
    "transfer project to another developer",
    "software development IP assignment",
    "no licence fee custom software",
    "agency hosted VPS ownership",
  ],
  "support-after-launch": [
    "software maintenance after launch",
    "post-launch app support UK",
    "app maintenance cost",
    "software support contract scope",
    "app store rejection resubmission",
    "iOS SDK update maintenance",
    "production incident response software",
    "what does app maintenance include",
  ],
};

export function generateStaticParams() {
  return getAllHowWeWorkSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale: Locale = isLocale(rawLocale) ? (rawLocale as Locale) : "en";
  const routeKey = ROUTE_KEY_BY_SLUG[slug];
  if (!routeKey) return { title: "How we work" };
  return buildLocalizedMetadata({
    locale,
    routeKey,
    path: `/how-we-work/${slug}`,
    keywords: KEYWORDS_BY_SLUG[slug] ?? [],
    markdownAlternate: true,
  });
}

export default async function HowWeWorkEntryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const entry = getHowWeWorkEntry(slug, locale);
  if (!entry) notFound();

  const dict = await getDictionary(locale);
  const d = dict.howWeWorkDetail;
  const entries = getHowWeWork(locale);
  const currentIndex = entries.findIndex((e) => e.slug === slug);
  const next = entries[(currentIndex + 1) % entries.length];
  const prev = entries[(currentIndex - 1 + entries.length) % entries.length];
  const fullTitle = getHowWeWorkFullTitle(entry);

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: `${SITE_URL}/${locale}` },
          { name: "How we work", url: `${SITE_URL}/${locale}/how-we-work` },
          {
            name: fullTitle,
            url: `${SITE_URL}/${locale}/how-we-work/${slug}`,
          },
        ]}
      />
      <FaqSchema
        items={entry.faq}
        path={`/how-we-work/${slug}`}
        locale={locale}
      />

      {/* ============================================================ */}
      {/* HERO BAND — 7/5                                               */}
      {/* ============================================================ */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 pt-12 lg:pt-20 pb-16 lg:pb-24">
          <Rail
            items={[
              d.rail.indexTpl.replace("{code}", entry.code),
              entry.badge,
              d.rail.principle,
            ]}
            className="mb-10"
          />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <span className="text-mono text-[var(--color-text-faint)]">
                {entry.code}
              </span>
              <h1 className="text-display mt-6">
                <span className="block">{entry.title}</span>
                <span className="block text-[var(--color-text-dim)]">
                  {entry.titleSecondary}
                </span>
              </h1>
              <p className="text-body-strong mt-6 max-w-xl">{entry.tagline}</p>
            </div>
            <div className="lg:col-span-5 self-end">
              <p className="text-body">{entry.summary}</p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link
                  href={localizePath(locale, "/#contact")}
                  className="btn-primary"
                >
                  <span>{d.hero.ctaContact}</span>
                  <span aria-hidden="true" className="btn-arrow">
                    →
                  </span>
                </Link>
                <Link
                  href={localizePath(locale, "/how-we-work")}
                  className="btn-secondary"
                >
                  <span>{d.hero.ctaAll}</span>
                  <span aria-hidden="true" className="btn-arrow">
                    →
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* AT A GLANCE + SECTIONS — 4/8                                  */}
      {/* ============================================================ */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-4">
              <p className="text-label text-[var(--color-primary-glow)]">
                {d.sections.eyebrow}
              </p>
              <h2 className="text-headline mt-5 mb-8">{d.sections.title}</h2>
              <Panel innerClassName="p-6 lg:p-8" corners>
                <p className="text-label-sm text-[var(--color-text-dim)] mb-4">
                  {d.hero.specsLabel}
                </p>
                {entry.meta.map((m) => (
                  <SpecRow key={m.label} label={m.label} value={m.value} />
                ))}
              </Panel>
            </div>
            <div className="lg:col-span-7 lg:col-start-6 space-y-10">
              {entry.sections.map((section, i) => (
                <div key={section.heading}>
                  <div className="flex items-baseline gap-4 mb-3">
                    <span className="text-mono text-[var(--color-text-faint)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-title">{section.heading}</h3>
                  </div>
                  <p className="text-body">{section.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FAQ — marked up as FAQPage above; text must stay visible here  */}
      {/* ============================================================ */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-4">
              <p className="text-label text-[var(--color-primary-glow)]">
                {d.faq.eyebrow}
              </p>
              <h2 className="text-headline mt-5">{d.faq.title}</h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6 space-y-5">
              {entry.faq.map((item) => (
                <Panel key={item.q} innerClassName="p-6 lg:p-7">
                  <h3 className="text-title mb-3">{item.q}</h3>
                  <p className="text-body">{item.a}</p>
                </Panel>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CTA + NAVIGATION — 7/5                                        */}
      {/* ============================================================ */}
      <section>
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7">
              <p className="text-label text-[var(--color-primary-glow)]">
                {d.cta.eyebrow}
              </p>
              <h2
                className="text-display mt-6"
                style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
              >
                {d.cta.title}
              </h2>
              <p className="text-body mt-6 max-w-lg">{d.cta.body}</p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link
                  href={localizePath(locale, "/#contact")}
                  className="btn-primary"
                >
                  <span>{d.cta.sendBrief}</span>
                  <span aria-hidden="true" className="btn-arrow">
                    →
                  </span>
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <Link
                href={localizePath(locale, `/how-we-work/${prev.slug}`)}
                className="block group"
              >
                <Panel innerClassName="p-5 h-full">
                  <span className="text-label-sm text-[var(--color-text-dim)]">
                    {d.cta.previous}
                  </span>
                  <p className="text-mono text-[var(--color-text-faint)] mt-3">
                    {prev.code}
                  </p>
                  <p className="text-body-strong mt-1">
                    {getHowWeWorkFullTitle(prev)}
                  </p>
                </Panel>
              </Link>
              <Link
                href={localizePath(locale, `/how-we-work/${next.slug}`)}
                className="block group"
              >
                <Panel innerClassName="p-5 h-full text-right">
                  <span className="text-label-sm text-[var(--color-text-dim)]">
                    {d.cta.next}
                  </span>
                  <p className="text-mono text-[var(--color-text-faint)] mt-3">
                    {next.code}
                  </p>
                  <p className="text-body-strong mt-1">
                    {getHowWeWorkFullTitle(next)}
                  </p>
                </Panel>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
