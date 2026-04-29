import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Panel, Rail, SpecRow } from "@/components/panel";
import { getDictionary } from "@/lib/dictionaries";
import {
  LOCALES,
  LOCALE_HTML_LANG,
  isLocale,
  type Locale,
} from "@/lib/i18n";

const SITE_URL = "https://simnetiq.store";

const PRIVACY_KEYWORDS = [
  "Simnetiq privacy policy",
  "Simnetiq eSIM privacy policy",
  "GDPR privacy policy UK",
  "Simnetiq Ltd data controller",
  "UK ICO privacy policy",
  "eSIM app privacy policy",
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
      "Privacy Policy for Simnetiq Ltd and its products including the Simnetiq eSIM app. GDPR-aligned processing, UK ICO oversight, data controller at 2 Frederick Street, Kings Cross, London. Details on data collection, retention, rights, sharing with eSIM and payment processors, cookies, and children's privacy.",
  },
  he: {
    title: "מדיניות פרטיות — Simnetiq Ltd",
    description:
      "מדיניות פרטיות של Simnetiq Ltd ושל מוצריה, כולל יישום ה-eSIM של סימנטיק. עיבוד תואם GDPR, פיקוח של ICO הבריטית, אחראי על המידע בכתובת 2 Frederick Street, Kings Cross, London. פרטי איסוף מידע, שמירה, זכויות, שיתוף עם ספקי eSIM ועיבוד תשלומים, עוגיות ופרטיות ילדים.",
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
    openGraph: {
      title: c.title,
      description: c.description,
      url,
      siteName: "Simnetiq",
      type: "website",
      locale: locale === "he" ? "he_IL" : "en_GB",
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
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 pt-12 lg:pt-20 pb-14 lg:pb-20">
          <Rail
            items={[p.rail.index, p.rail.policy, p.rail.rev]}
            className="mb-10"
          />
          <p className="text-label text-[var(--color-primary-glow)]">
            {p.eyebrow}
          </p>
          <h1 className="text-display mt-6 max-w-3xl">{p.title}</h1>
          <p className="text-mono mt-6">{dict.common.lastUpdatedApr2026}</p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            {/* Meta sidebar */}
            <aside className="lg:col-span-3">
              <div className="lg:sticky lg:top-28 space-y-6">
                <Panel innerClassName="p-5">
                  <p className="text-label-sm text-[var(--color-text-faint)] mb-3">
                    {p.documentLabel}
                  </p>
                  <SpecRow label={p.revision} value={dict.common.revisionApr2026} />
                  <SpecRow label={p.protocol} value="1.0.0" />
                  <SpecRow label={p.jurisdiction} value={p.jurisdictionValue} />
                  <SpecRow label={p.entries} value={String(p.blocks.length)} />
                </Panel>
                <Panel innerClassName="p-5">
                  <p className="text-label-sm text-[var(--color-text-faint)] mb-3">
                    {p.contactLabel}
                  </p>
                  <p className="text-body-strong text-[var(--color-text)]">
                    support@simnetiq.store
                  </p>
                  <p className="text-body mt-2">Simnetiq Ltd</p>
                  <p className="text-body">{p.kingsCross}</p>
                </Panel>
              </div>
            </aside>

            {/* Body */}
            <div className="lg:col-span-9">
              <div className="space-y-8 lg:space-y-10 max-w-3xl">
                {p.blocks.map((b, i) => (
                  <div key={b.title} className="grid grid-cols-12 gap-4">
                    <div className="col-span-2 sm:col-span-1 text-mono text-[var(--color-text-faint)] pt-1">
                      {String(i + 1)}
                    </div>
                    <div className="col-span-10 sm:col-span-11">
                      <h2 className="text-title mb-2">{b.title}</h2>
                      <p className="text-body">{b.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-[var(--color-border)] mt-14 pt-8">
                <p className="text-mono">
                  {dict.common.endOfDocument.replace("{year}", String(year))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
