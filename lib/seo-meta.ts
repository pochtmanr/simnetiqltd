import type { Metadata } from "next";
import { LOCALES, LOCALE_HTML_LANG, type Locale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

export const SITE_NAME = "Simnetiq";

const OG_LOCALE: Record<Locale, string> = {
  en: "en_GB",
  he: "he_IL",
  ru: "ru_RU",
};

type LocalizedCopy = { title: string; description: string };

type RouteCopy = Record<Locale, LocalizedCopy>;

const HOME: RouteCopy = {
  en: {
    title:
      "Simnetiq — London Software Engineering Studio",
    description:
      "Simnetiq is a London technology studio: iOS, Android, macOS, Windows and Linux applications; Next.js and Supabase web platforms; LLM and RAG integration with Anthropic and OpenAI; VPN infrastructure. End-to-end brief to production.",
  },
  he: {
    title:
      "סימנטיק — אולפן הנדסת תוכנה בלונדון",
    description:
      "סימנטיק הוא אולפן טכנולוגיה מלונדון: אפליקציות מקוריות ל-iOS, Android, macOS, Windows ו-Linux; פלטפורמות ווב על Next.js ו-Supabase; אינטגרציית LLM ו-RAG עם Anthropic ו-OpenAI; תשתית VPN. מקצה לקצה — מתיק עד ייצור.",
  },
  ru: {
    title:
      "Simnetiq — лондонская студия разработки ПО",
    description:
      "Simnetiq — лондонская технологическая студия: нативные приложения для iOS, Android, macOS, Windows и Linux; веб-платформы на Next.js и Supabase; интеграция LLM и RAG с Anthropic и OpenAI; VPN-инфраструктура. От брифа до продакшена.",
  },
};

const ABOUT: RouteCopy = {
  en: {
    title: "About Simnetiq — London Software Studio",
    description:
      "About Simnetiq Ltd — a London-based technology studio and engineering collective. Incorporated in England & Wales (Company No. 16861177). Two owner-operators covering mobile, web, AI, VPN infrastructure, and legal. Registered at 2 Frederick Street, Kings Cross, London.",
  },
  he: {
    title: "אודות סימנטיק — אולפן תוכנה בלונדון",
    description:
      "אודות Simnetiq Ltd — אולפן טכנולוגיה מבוסס לונדון. רשום באנגליה ובוויילס (מספר חברה 16861177). שני שותפים-מפעילים המכסים מובייל, ווב, AI, תשתית VPN ומשפטים. כתובת רשומה: 2 Frederick Street, Kings Cross, London.",
  },
  ru: {
    title: "О Simnetiq — лондонская студия разработки",
    description:
      "О компании Simnetiq Ltd — технологическая студия из Лондона. Зарегистрирована в Англии и Уэльсе (Companies House 16861177). Два владельца-практика, работающих по направлениям mobile, web, AI, VPN-инфраструктура и юридическое сопровождение. Юридический адрес: 2 Frederick Street, Kings Cross, London.",
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
  ru: {
    title: "Проекты — примеры Simnetiq",
    description:
      "Примеры Simnetiq: Doppler VPN (VLESS-Reality, iOS/Android), Creator AI (LLM-платформа контента на Anthropic и OpenAI), Physics.explained (open-source интерактивная физика) и Go Delivery / ISR Shipping (логистическая платформа с GPS-трекингом). Портфолио, кейсы и живые приложения лондонской студии.",
  },
};

const SERVICES: RouteCopy = {
  en: {
    title: "Services — Development, AI & Infrastructure",
    description:
      "Simnetiq services: iOS/Android/macOS/Windows/Linux app development; Next.js, Supabase and Stripe web platforms; AI and LLM integration across Anthropic and OpenAI; VPN infrastructure. Every engagement priced in GBP against a signed SOW.",
  },
  he: {
    title: "שירותים — פיתוח, AI ותשתית",
    description:
      "שירותי סימנטיק: פיתוח אפליקציות ל-iOS/Android/macOS/Windows/Linux; פלטפורמות ווב על Next.js, Supabase ו-Stripe; אינטגרציית AI ו-LLM ב-Anthropic ו-OpenAI; תשתית VPN. כל התקשרות מתומחרת ב-GBP מול SOW חתום.",
  },
  ru: {
    title: "Услуги — разработка, AI и инфраструктура",
    description:
      "Услуги Simnetiq: разработка приложений для iOS/Android/macOS/Windows/Linux; веб-платформы на Next.js, Supabase и Stripe; интеграция AI и LLM на базе Anthropic и OpenAI; VPN-инфраструктура. Каждый контракт оценивается в GBP по подписанному SOW.",
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
  ru: {
    title: "Doppler VPN — кейс",
    description:
      "Doppler VPN — устойчивый к цензуре VPN на основе VLESS-Reality. Трафик неотличим от обычного HTTPS, обходит DPI, ТСПУ и активное зондирование. Без регистрации, без логов, нативные клиенты для iOS, Android, macOS и Windows. Оплата картой или криптовалютой.",
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
  ru: {
    title: "Physics.explained — кейс",
    description:
      "Physics.explained — open-source интерактивная энциклопедия физики, созданная Simnetiq. Живая энциклопедия, охватывающая классическую механику, электромагнетизм, термодинамику, теорию относительности, квантовую и современную физику — построена на покрытых тестами решателях ОДУ, WebGL-визуализациях, связном графе понятий и AI-репетиторе на /ask с обоснованными выводами на материале библиотеки.",
  },
};

const CASE_GREENFLAGGED: RouteCopy = {
  en: {
    title: "Green Flagged — Case Study",
    description:
      "Green Flagged is an AI contract reviewer for freelancers and small teams. Drop a PDF or paste contract text and get a plain-language verdict — flagged clauses, severity grades, and suggested redlines — in under eight minutes. Built around an editorial / spec-sheet aesthetic with a light-first token system. Marketing site live; scanning engine in development.",
  },
  he: {
    title: "Green Flagged — מקרה בוחן",
    description:
      "Green Flagged הוא סוקר חוזים מבוסס AI לפרילנסרים וצוותים קטנים. גוררים PDF או מדביקים טקסט חוזה ומקבלים פסיקה בשפה פשוטה — סעיפים מסומנים, דרגות חומרה והצעות לתיקון — בפחות משמונה דקות. עיצוב במראה של דף מפרט עריכתי עם מערכת טוקנים שמתחילה במצב בהיר. אתר השיווק עלה; מנוע הסריקה בפיתוח.",
  },
  ru: {
    title: "Green Flagged — кейс",
    description:
      "Green Flagged — AI-ревьюер контрактов для фрилансеров и небольших команд. Загрузите PDF или вставьте текст договора и получите вердикт простым языком — отмеченные пункты, оценку рисков и предложения правок — менее чем за восемь минут. Построен на редакторско-спецификационной эстетике со светлой токен-системой. Маркетинговый сайт запущен; движок сканирования в разработке.",
  },
};

const CASE_SMSACTIVATE: RouteCopy = {
  en: {
    title: "SMS Activate — Case Study",
    description:
      "SMS Activate by SIMNETIQ rents you a real carrier number in 50+ countries for exactly as long as a verification code takes to arrive. 35+ services from Telegram to PayPal, codes in about thirty seconds, single-use numbers, and one-time credit packs that never expire — no SIM, no eSIM, no subscription, no personal number handed over. Web, iOS and Android.",
  },
  he: {
    title: "SMS Activate — מקרה בוחן",
    description:
      "SMS Activate מבית SIMNETIQ משכיר לך מספר אמיתי ברשת סלולרית ביותר מ-50 מדינות בדיוק לפרק הזמן שלוקח לקוד אימות להגיע. יותר מ-35 שירותים — מטלגרם ועד PayPal, קודים בתוך כשלושים שניות, מספרים לשימוש חד-פעמי וחבילות קרדיט חד-פעמיות שאינן פגות תוקף — בלי SIM, בלי eSIM, בלי מנוי ובלי למסור את המספר האישי. ווב, iOS ואנדרואיד.",
  },
  ru: {
    title: "SMS Activate — кейс",
    description:
      "SMS Activate от SIMNETIQ выдаёт настоящий номер оператора в 50+ странах ровно на то время, которое нужно коду подтверждения. 35+ сервисов — от Telegram до PayPal, код приходит примерно за тридцать секунд, номера одноразовые, а разовые пакеты кредитов не сгорают — без SIM, без eSIM, без подписки и без передачи личного номера. Веб, iOS и Android.",
  },
};

const CASE_VISAPASSAGE: RouteCopy = {
  en: {
    title: "VisaPassage — Case Study",
    description:
      "VisaPassage is multi-passport visa intelligence. One encrypted profile holds every passport, residency and document; the comparison engine ranks routes across all of them by least paperwork, shortest wait and lowest cost, then generates a country-specific checklist and auto-fills the government forms. Versioned, expiry-aware document vault with access logging. Free to start, no card required.",
  },
  he: {
    title: "VisaPassage — מקרה בוחן",
    description:
      "VisaPassage היא פלטפורמת מודיעין ויזות לבעלי דרכונים מרובים. פרופיל מוצפן אחד מחזיק כל דרכון, תושבות ומסמך; מנוע ההשוואה מדרג מסלולים על פני כולם לפי מינימום ניירת, זמן ההמתנה הקצר ביותר והעלות הנמוכה ביותר, ואז מייצר רשימת מסמכים ייעודית למדינה וממלא אוטומטית את הטפסים הממשלתיים. כספת מסמכים עם ניהול גרסאות, מעקב תפוגה ותיעוד גישה. התחלה חינם, ללא כרטיס אשראי.",
  },
  ru: {
    title: "VisaPassage — кейс",
    description:
      "VisaPassage — визовая аналитика для владельцев нескольких паспортов. Один зашифрованный профиль хранит все паспорта, виды на жительство и документы; движок сравнения ранжирует маршруты по всем из них — меньше бумаг, короче ожидание, ниже стоимость, — затем формирует чек-лист под конкретную страну и автоматически заполняет государственные формы. Хранилище документов с версиями, контролем сроков и журналом доступа. Начать бесплатно, без карты.",
  },
};

export const ROUTE_COPY = {
  home: HOME,
  about: ABOUT,
  projects: PROJECTS,
  services: SERVICES,
  caseStudyDoppler: CASE_DOPPLER,
  caseStudyPhysics: CASE_PHYSICS,
  caseStudyGreenFlagged: CASE_GREENFLAGGED,
  caseStudySmsActivate: CASE_SMSACTIVATE,
  caseStudyVisaPassage: CASE_VISAPASSAGE,
} as const;

export type RouteKey = keyof typeof ROUTE_COPY;

// Default OG/Twitter card. 1200×630 PNG served from /public so the URL
// stays stable (CDN-friendly) and doesn't depend on Next's hashed
// file-convention path. Per-route callers can override via `ogImage`.
const DEFAULT_OG_IMAGE = "/opengraph-image.png";

type BuildMetaInput = {
  locale: Locale;
  routeKey: RouteKey;
  /** Path AFTER the locale segment, e.g. "/about" or "/projects/doppler-vpn". Empty string for the home route. */
  path: string;
  keywords?: string[];
  /** Override the default OG/Twitter card image. */
  ogImage?: string;
  ogType?: "website" | "article";
  /** When true, advertise a Markdown alternate at `${url}/markdown` for AI agents. */
  markdownAlternate?: boolean;
};

export function buildLocalizedMetadata({
  locale,
  routeKey,
  path,
  keywords,
  ogImage,
  ogType = "website",
  markdownAlternate = false,
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

  const image = ogImage ?? DEFAULT_OG_IMAGE;

  return {
    title: { absolute: copy.title },
    description: copy.description,
    keywords,
    alternates: {
      canonical: url,
      languages,
      ...(markdownAlternate
        ? { types: { "text/markdown": `${url}/markdown` } }
        : {}),
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url,
      siteName: SITE_NAME,
      type: ogType,
      locale: OG_LOCALE[locale],
      alternateLocale: alternateLocales,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: copy.title,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: [image],
    },
  };
}
