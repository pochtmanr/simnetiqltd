import type { Metadata } from "next";
import {
  LOCALES,
  LOCALE_HTML_LANG,
  isLocale,
  type Locale,
} from "@/lib/i18n";

const SITE_URL = "https://simnetiq.store";

const LEGAL_KEYWORDS = [
  "Simnetiq legal",
  "Simnetiq Ltd impressum",
  "Simnetiq terms",
  "Simnetiq company details",
  "Simnetiq Companies House",
  "Simnetiq 16861177",
  "Simnetiq registered office",
  "UK limited company impressum",
  "London software studio impressum",
];

const COPY: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "Legal — Simnetiq Ltd Impressum, Terms & Company Details",
    description:
      "Legal documentation for Simnetiq Ltd — Companies House No. 16861177, registered in England & Wales. Impressum, terms of engagement, company details, registered office at 2 Frederick Street, Kings Cross, London, WC1X 0ND.",
  },
  he: {
    title: "משפטי — Simnetiq Ltd פרטי חברה ותנאים",
    description:
      "תיעוד משפטי של Simnetiq Ltd — מספר רישום 16861177 ברשם החברות, רשומה באנגליה ובוויילס. פרטי חברה, תנאי התקשרות וכתובת רשומה: 2 Frederick Street, Kings Cross, London, WC1X 0ND.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? (rawLocale as Locale) : "en";
  const url = `${SITE_URL}/${locale}/legal`;
  const languages: Record<string, string> = Object.fromEntries(
    LOCALES.map((l) => [LOCALE_HTML_LANG[l], `${SITE_URL}/${l}/legal`])
  );
  languages["x-default"] = `${SITE_URL}/en/legal`;
  const c = COPY[locale];
  return {
    title: c.title,
    description: c.description,
    keywords: LEGAL_KEYWORDS,
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

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
