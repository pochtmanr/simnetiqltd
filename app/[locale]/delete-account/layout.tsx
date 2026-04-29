import type { Metadata } from "next";
import {
  LOCALES,
  LOCALE_HTML_LANG,
  isLocale,
  type Locale,
} from "@/lib/i18n";

const SITE_URL = "https://simnetiq.store";

const DELETE_KEYWORDS = [
  "Simnetiq delete account",
  "Simnetiq data deletion",
  "Simnetiq eSIM delete account",
  "account deletion request",
  "GDPR data deletion",
  "App Store data deletion compliance",
  "Google Play data deletion compliance",
];

const DELETE_COPY: Record<
  Locale,
  { title: string; description: string }
> = {
  en: {
    title: "Delete Account — Simnetiq Data Deletion Request",
    description:
      "Request permanent account and data deletion from Simnetiq services, including the Simnetiq eSIM app. GDPR-compliant deletion flow, App Store and Google Play policy compliant. Processed within 30 days.",
  },
  he: {
    title: "מחיקת חשבון — בקשת מחיקת נתונים מסימנטיק",
    description:
      "בקשת מחיקה קבועה של חשבון ונתונים משירותי סימנטיק, כולל יישום ה-eSIM של סימנטיק. תהליך תואם GDPR, תואם מדיניות App Store ו-Google Play. מטופל תוך 30 יום.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? (rawLocale as Locale) : "en";
  const url = `${SITE_URL}/${locale}/delete-account`;
  const languages: Record<string, string> = Object.fromEntries(
    LOCALES.map((l) => [
      LOCALE_HTML_LANG[l],
      `${SITE_URL}/${l}/delete-account`,
    ])
  );
  languages["x-default"] = `${SITE_URL}/en/delete-account`;
  const c = DELETE_COPY[locale];
  return {
    title: c.title,
    description: c.description,
    keywords: DELETE_KEYWORDS,
    alternates: { canonical: url, languages },
    robots: { index: true, follow: true },
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

export default function DeleteAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
