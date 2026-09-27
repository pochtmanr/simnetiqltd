import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { CardArrow } from "@/components/sections/card-arrow";
import styles from "@/components/how-we-work.module.css";
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

      <PageHeader title={entry.title} subtitle={entry.titleSecondary} description={entry.summary} />
      <div className={`${styles.container} ${styles.heroActions}`}>
        <p className={styles.tagline}>{entry.tagline}</p>
        <div className={styles.actions}>
          <Link href={localizePath(locale, "/#contact")} className="btn-primary">
            <span>{d.hero.ctaContact}</span><CardArrow />
          </Link>
          <Link href={localizePath(locale, "/how-we-work")} className="btn-secondary">
            <span>{d.hero.ctaAll}</span><CardArrow />
          </Link>
        </div>
      </div>

      <section className={`${styles.container} ${styles.section} ${styles.editorial}`}>
        <div className={styles.sectionIntro}>
          <h2>{d.sections.title}</h2>
          <dl className={styles.facts} aria-label={d.hero.specsLabel}>
            {entry.meta.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className={styles.prose}>
          {entry.sections.map((section) => (
            <div key={section.heading} className={styles.proseItem}>
              <h3>{section.heading}</h3>
              <p className="text-body">{section.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`${styles.container} ${styles.section} ${styles.editorial}`}>
        <div className={styles.sectionIntro}>
          <h2>{d.faq.title}</h2>
        </div>
        <div className={styles.prose}>
          {entry.faq.map((item) => (
            <div key={item.q} className={styles.proseItem}>
              <h3>{item.q}</h3>
              <p className="text-body">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`${styles.container} ${styles.section}`}>
        <div className={styles.contact}>
          <h2>{d.cta.title}</h2>
          <div>
            <p className="text-body">{d.cta.body}</p>
            <div className={styles.actions}>
              <Link href={localizePath(locale, "/#contact")} className="btn-primary">
                <span>{d.cta.sendBrief}</span><CardArrow />
              </Link>
            </div>
          </div>
        </div>
        <nav className={styles.related}>
          <Link href={localizePath(locale, `/how-we-work/${prev.slug}`)} className={styles.relatedLink}>
            <span className={styles.direction}>{d.cta.previous}</span>
            <span className={styles.relatedTitle}>{getHowWeWorkFullTitle(prev)}<CardArrow /></span>
          </Link>
          <Link href={localizePath(locale, `/how-we-work/${next.slug}`)} className={styles.relatedLink}>
            <span className={styles.direction}>{d.cta.next}</span>
            <span className={styles.relatedTitle}>{getHowWeWorkFullTitle(next)}<CardArrow /></span>
          </Link>
        </nav>
      </section>
    </>
  );
}
