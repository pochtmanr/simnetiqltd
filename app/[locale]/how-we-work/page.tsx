import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { CardArrow } from "@/components/sections/card-arrow";
import styles from "@/components/how-we-work.module.css";
import { getHowWeWork } from "@/lib/how-we-work";
import { BreadcrumbSchema } from "@/components/structured-data";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, localizePath, type Locale } from "@/lib/i18n";
import { buildLocalizedMetadata } from "@/lib/seo-meta";
import { SITE_URL } from "@/lib/site";

const HOW_WE_WORK_KEYWORDS = [
  "how software agencies work",
  "what to check before hiring a software agency",
  "questions to ask a development agency",
  "software development engagement model",
  "fixed price software development UK",
  "software development statement of work",
  "work directly with developers",
  "software agency no account manager",
  "who owns the code software agency",
  "software IP ownership UK",
  "avoid vendor lock-in software",
  "software maintenance after launch",
  "post-launch app support UK",
  "London software studio engagement terms",
  "small software studio vs agency",
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
    routeKey: "howWeWork",
    path: "/how-we-work",
    keywords: HOW_WE_WORK_KEYWORDS,
    markdownAlternate: true,
  });
}

type Params = Promise<{ locale: string }>;

export default async function HowWeWorkIndexPage({
  params,
}: {
  params: Params;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);
  const h = dict.howWeWorkIndex;
  const entries = getHowWeWork(locale);

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: `${SITE_URL}/${locale}` },
          { name: "How we work", url: `${SITE_URL}/${locale}/how-we-work` },
        ]}
      />

      <PageHeader title={h.titleLine1} subtitle={h.titleLine2} description={h.body} />

      <section className={`${styles.container} ${styles.directory}`}>
        {entries.map((entry) => (
          <article key={entry.slug} className={styles.entry}>
            <h2 className={styles.entryTitle}>
              <Link href={localizePath(locale, `/how-we-work/${entry.slug}`)}>
                {entry.title} <span>{entry.titleSecondary}</span>
              </Link>
            </h2>
            <div>
              <p className={`text-body ${styles.summary}`}>{entry.summary}</p>
              <Link
                href={localizePath(locale, `/how-we-work/${entry.slug}`)}
                className={styles.textLink}
              >
                <span>{h.readMore}</span>
                <CardArrow />
              </Link>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
