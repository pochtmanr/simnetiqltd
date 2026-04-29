import type { Metadata } from "next";
import { LOCALES, LOCALE_HTML_LANG, type Locale } from "@/lib/i18n";

export const SITE_URL = "https://simnetiq.store";
export const SITE_NAME = "Simnetiq";

const OG_LOCALE: Record<Locale, string> = {
  en: "en_GB",
  he: "he_IL",
};

type LocalizedCopy = { title: string; description: string };

type RouteCopy = Record<Locale, LocalizedCopy>;

const HOME: RouteCopy = {
  en: {
    title:
      "Simnetiq — London Software Engineering & Growth Marketing Studio",
    description:
      "Simnetiq is a London technology studio: iOS, Android, macOS, Windows and Linux applications; Next.js and Supabase web platforms; LLM and RAG integration with Anthropic and OpenAI; paid acquisition across Meta, TikTok and Google wired to AppsFlyer and Adjust; VPN infrastructure. End-to-end brief to production.",
  },
  he: {
    title:
      "סימנטיק — אולפן הנדסת תוכנה ושיווק צמיחה בלונדון",
    description:
      "סימנטיק הוא אולפן טכנולוגיה מלונדון: אפליקציות מקוריות ל-iOS, Android, macOS, Windows ו-Linux; פלטפורמות ווב על Next.js ו-Supabase; אינטגרציית LLM ו-RAG עם Anthropic ו-OpenAI; רכישה ממומנת ב-Meta, TikTok וגוגל המחוברת ל-AppsFlyer ו-Adjust; תשתית VPN. מקצה לקצה — מתיק עד ייצור.",
  },
};

const ABOUT: RouteCopy = {
  en: {
    title: "About Simnetiq — London Software & Marketing Studio",
    description:
      "About Simnetiq Ltd — a London-based technology studio and engineering collective. Incorporated in England & Wales (Company No. 16861177). Three owner-operators covering mobile, web, AI, VPN infrastructure, paid acquisition, and legal. Registered at 2 Frederick Street, Kings Cross, London.",
  },
  he: {
    title: "אודות סימנטיק — אולפן תוכנה ושיווק בלונדון",
    description:
      "אודות Simnetiq Ltd — אולפן טכנולוגיה מבוסס לונדון. רשום באנגליה ובוויילס (מספר חברה 16861177). שלושה שותפים-מפעילים המכסים מובייל, ווב, AI, תשתית VPN, רכישה ממומנת ומשפטים. כתובת רשומה: 2 Frederick Street, Kings Cross, London.",
  },
};

const PROJECTS: RouteCopy = {
  en: {
    title: "Projects — Simnetiq Deployments",
    description:
      "Simnetiq production deployments: Doppler VPN (VLESS-Reality, iOS/Android), Creator AI (LLM content platform on Anthropic and OpenAI), Physics.explained (open-source interactive physics), and Go Delivery / ISR Shipping (GPS-tracked logistics platform). Portfolio, case studies, and live apps from the London studio.",
  },
  he: {
    title: "פרויקטים — פריסות של סימנטיק",
    description:
      "פריסות ייצור של סימנטיק: Doppler VPN (VLESS-Reality, iOS/Android), Creator AI (פלטפורמת תוכן LLM על Anthropic ו-OpenAI), Physics.explained (פיזיקה אינטראקטיבית בקוד פתוח) ו-Go Delivery / ISR Shipping (פלטפורמת לוגיסטיקה עם מעקב GPS). תיק עבודות, מקרי בוחן ואפליקציות חיות מהאולפן בלונדון.",
  },
};

const SERVICES: RouteCopy = {
  en: {
    title: "Services — Development, AI, Growth Marketing & Infrastructure",
    description:
      "Simnetiq services: iOS/Android/macOS/Windows/Linux app development; Next.js, Supabase and Stripe web platforms; AI and LLM integration across Anthropic and OpenAI; paid acquisition on Meta, TikTok and Google with AppsFlyer and Adjust attribution; VPN infrastructure. Every engagement priced in GBP against a signed SOW.",
  },
  he: {
    title: "שירותים — פיתוח, AI, שיווק צמיחה ותשתית",
    description:
      "שירותי סימנטיק: פיתוח אפליקציות ל-iOS/Android/macOS/Windows/Linux; פלטפורמות ווב על Next.js, Supabase ו-Stripe; אינטגרציית AI ו-LLM ב-Anthropic ו-OpenAI; רכישה ממומנת ב-Meta, TikTok וגוגל עם ייחוס AppsFlyer ו-Adjust; תשתית VPN. כל התקשרות מתומחרת ב-GBP מול SOW חתום.",
  },
};

const CASE_DOPPLER: RouteCopy = {
  en: {
    title: "Doppler VPN — Case Study",
    description:
      "Doppler VPN is a censorship-resistant VPN built on VLESS-Reality. Traffic is indistinguishable from normal HTTPS, defeats deep packet inspection, TSPU, and active probing. No registration, no logs, native apps on iOS, Android, macOS, and Windows. Pay with card or crypto.",
  },
  he: {
    title: "Doppler VPN — מקרה בוחן",
    description:
      "Doppler VPN הוא VPN עמיד-צנזורה הבנוי על VLESS-Reality. התעבורה נראית כמו HTTPS רגיל — בלתי ניתנת לזיהוי על ידי DPI, עמידה מול TSPU וגישוש אקטיבי. ללא רישום, ללא לוגים, אפליקציות מקוריות ל-iOS, Android, macOS ו-Windows. תשלום בכרטיס או בקריפטו.",
  },
};

const CASE_PHYSICS: RouteCopy = {
  en: {
    title: "Physics.explained — Case Study",
    description:
      "Physics.explained is an open-source interactive physics encyclopedia built by Simnetiq. A live encyclopedia spanning classical mechanics, electromagnetism, thermodynamics, relativity, quantum and modern physics — powered by unit-tested ODE solvers, WebGL visualisations, a cross-linked concept graph, and an AI tutor at /ask that answers questions with derivations grounded in the library.",
  },
  he: {
    title: "Physics.explained — מקרה בוחן",
    description:
      "Physics.explained היא אנציקלופדיית פיזיקה אינטראקטיבית בקוד פתוח שנבנתה על ידי סימנטיק. אנציקלופדיה חיה המקיפה מכניקה קלאסית, אלקטרומגנטיות, תרמודינמיקה, יחסות, קוונטים ופיזיקה מודרנית — מבוססת פותרי ODE עם בדיקות יחידה, ויזואליזציות WebGL, גרף מושגים מקושר ומורה בינה מלאכותית ב-/ask.",
  },
};

export const ROUTE_COPY = {
  home: HOME,
  about: ABOUT,
  projects: PROJECTS,
  services: SERVICES,
  caseStudyDoppler: CASE_DOPPLER,
  caseStudyPhysics: CASE_PHYSICS,
} as const;

export type RouteKey = keyof typeof ROUTE_COPY;

type BuildMetaInput = {
  locale: Locale;
  routeKey: RouteKey;
  /** Path AFTER the locale segment, e.g. "/about" or "/projects/doppler-vpn". Empty string for the home route. */
  path: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: "website" | "article";
};

export function buildLocalizedMetadata({
  locale,
  routeKey,
  path,
  keywords,
  ogImage,
  ogType = "website",
}: BuildMetaInput): Metadata {
  const copy = ROUTE_COPY[routeKey][locale];
  const url = `${SITE_URL}/${locale}${path}`;

  const languages: Record<string, string> = Object.fromEntries(
    LOCALES.map((l) => [LOCALE_HTML_LANG[l], `${SITE_URL}/${l}${path}`])
  );
  languages["x-default"] = `${SITE_URL}/en${path}`;

  const alternateLocales = LOCALES.filter((l) => l !== locale).map(
    (l) => OG_LOCALE[l]
  );

  const image = ogImage ?? "/icon-512.png";

  return {
    title: { absolute: copy.title },
    description: copy.description,
    keywords,
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url,
      siteName: SITE_NAME,
      type: ogType,
      locale: OG_LOCALE[locale],
      alternateLocale: alternateLocales,
      images: [{ url: image, alt: copy.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: [image],
    },
  };
}
