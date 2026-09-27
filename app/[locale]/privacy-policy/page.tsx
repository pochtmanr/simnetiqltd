import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import styles from "@/components/document-pages.module.css";
import { getDictionary } from "@/lib/dictionaries";
import {
  LOCALES,
  LOCALE_HTML_LANG,
  isLocale,
  type Locale,
} from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

const PRIVACY_KEYWORDS = [
  "Simnetiq privacy policy",
  "Simnetiq app privacy policy",
  "GDPR privacy policy UK",
  "Simnetiq Ltd data controller",
  "UK ICO privacy policy",
  "mobile app privacy policy UK",
  "Simnetiq data retention",
  "Simnetiq data rights",
];

const PRIVACY_COPY: Record<
  Locale,
  { title: string; description: string }
> = {
  en: {
    title: "Privacy Policy — Simnetiq Ltd",
    description:
      "Privacy Policy for Simnetiq Ltd and its products. GDPR-aligned processing, UK ICO oversight, data controller at 2 Frederick Street, Kings Cross, London. Details on data collection, retention, rights, sharing with connectivity and payment processors, cookies, and children's privacy.",
  },
  he: {
    title: "מדיניות פרטיות — Simnetiq Ltd",
    description:
      "מדיניות פרטיות של Simnetiq Ltd ושל מוצריה. עיבוד תואם GDPR, פיקוח של ICO הבריטית, אחראי על המידע בכתובת 2 Frederick Street, Kings Cross, London. פרטי איסוף מידע, שמירה, זכויות, שיתוף עם ספקי קישוריות ועיבוד תשלומים, עוגיות ופרטיות ילדים.",
  },
  ru: {
    title: "Политика конфиденциальности — Simnetiq Ltd",
    description:
      "Политика конфиденциальности Simnetiq Ltd и её продуктов. Обработка данных в соответствии с GDPR, надзор UK ICO, контролёр данных по адресу 2 Frederick Street, Kings Cross, London. Подробности о сборе данных, сроках хранения, правах, передаче операторам связи и платёжным процессорам, cookie и конфиденциальности детей.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? (rawLocale as Locale) : "en";
  const url = `${SITE_URL}/${locale}/privacy-policy`;
  const languages: Record<string, string> = Object.fromEntries(
    LOCALES.map((l) => [
      LOCALE_HTML_LANG[l],
      `${SITE_URL}/${l}/privacy-policy`,
    ])
  );
  languages["x-default"] = `${SITE_URL}/en/privacy-policy`;
  const c = PRIVACY_COPY[locale];
  return {
    title: c.title,
    description: c.description,
    keywords: PRIVACY_KEYWORDS,
    alternates: { canonical: url, languages },
    robots: { index: false, follow: true },
    openGraph: {
      title: c.title,
      description: c.description,
      url,
      siteName: "Simnetiq",
      type: "website",
      locale: { en: "en_GB", he: "he_IL", ru: "ru_RU" }[locale],
    },
  };
}

type Params = Promise<{ locale: string }>;

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Params;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);
  const p = dict.privacy;
  const year = new Date().getFullYear();

  return (
    <>
      <PageHeader title={p.title} description={dict.common.lastUpdatedApr2026} />
      <div className={styles.container}>
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <nav className={styles.nav} aria-label={dict.legal.tocLabel}>
              {p.blocks.map((block, i) => (
                <a key={block.title} href={`#privacy-section-${i + 1}`}>{block.title}</a>
              ))}
            </nav>
            <h2 className={styles.label}>{p.contactLabel}</h2>
            <address className={styles.contact}>
              <a href="mailto:support@simnetiq.com">support@simnetiq.com</a>
              <span>Simnetiq Ltd</span>
              <span>{p.kingsCross}</span>
            </address>
            <h2 className={styles.label}>{p.documentLabel}</h2>
            <dl className={styles.facts}>
              <div><dt>{p.revision}</dt><dd>{dict.common.revisionApr2026}</dd></div>
              <div><dt>{p.jurisdiction}</dt><dd>{p.jurisdictionValue}</dd></div>
            </dl>
          </aside>
          <div className={styles.content}>
            {p.blocks.map((block, i) => (
              <article key={block.title} id={`privacy-section-${i + 1}`}>
                <h2 className={styles.heading}>{block.title}</h2>
                <p className={styles.body}>{block.body}</p>
              </article>
            ))}
            <p className={`${styles.note} ${styles.end}`}>
              {dict.common.endOfDocument.replace("{year}", String(year))}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
