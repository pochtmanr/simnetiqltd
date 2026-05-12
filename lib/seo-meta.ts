import type { Metadata } from "next";
import { LOCALES, LOCALE_HTML_LANG, type Locale } from "@/lib/i18n";

export const SITE_URL = "https://simnetiq.store";
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
  ru: {
    title:
      "Simnetiq — лондонская студия разработки ПО и growth-маркетинга",
    description:
      "Simnetiq — лондонская технологическая студия: нативные приложения для iOS, Android, macOS, Windows и Linux; веб-платформы на Next.js и Supabase; интеграция LLM и RAG с Anthropic и OpenAI; платный трафик в Meta, TikTok и Google с атрибуцией через AppsFlyer и Adjust; VPN-инфраструктура. От брифа до продакшена.",
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
  ru: {
    title: "О Simnetiq — лондонская студия разработки и маркетинга",
    description:
      "О компании Simnetiq Ltd — технологическая студия из Лондона. Зарегистрирована в Англии и Уэльсе (Companies House 16861177). Три владельца-практика, работающих по направлениям mobile, web, AI, VPN-инфраструктура, платный трафик и юридическое сопровождение. Юридический адрес: 2 Frederick Street, Kings Cross, London.",
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
    title: "Services — Development, AI, Growth Marketing & Infrastructure",
    description:
      "Simnetiq services: iOS/Android/macOS/Windows/Linux app development; Next.js, Supabase and Stripe web platforms; AI and LLM integration across Anthropic and OpenAI; paid acquisition on Meta, TikTok and Google with AppsFlyer and Adjust attribution; VPN infrastructure. Every engagement priced in GBP against a signed SOW.",
  },
  he: {
    title: "שירותים — פיתוח, AI, שיווק צמיחה ותשתית",
    description:
      "שירותי סימנטיק: פיתוח אפליקציות ל-iOS/Android/macOS/Windows/Linux; פלטפורמות ווב על Next.js, Supabase ו-Stripe; אינטגרציית AI ו-LLM ב-Anthropic ו-OpenAI; רכישה ממומנת ב-Meta, TikTok וגוגל עם ייחוס AppsFlyer ו-Adjust; תשתית VPN. כל התקשרות מתומחרת ב-GBP מול SOW חתום.",
  },
  ru: {
    title: "Услуги — разработка, AI, growth-маркетинг и инфраструктура",
    description:
      "Услуги Simnetiq: разработка приложений для iOS/Android/macOS/Windows/Linux; веб-платформы на Next.js, Supabase и Stripe; интеграция AI и LLM на базе Anthropic и OpenAI; платный трафик в Meta, TikTok и Google с атрибуцией AppsFlyer и Adjust; VPN-инфраструктура. Каждый контракт оценивается в GBP по подписанному SOW.",
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

const SUBSCRIBE: RouteCopy = {
  en: {
    title: "Subscribe — Simnetiq Briefings",
    description:
      "Subscribe to Simnetiq briefings — quiet, infrequent updates from a London engineering studio: shipping notes, infrastructure tear-downs, and the occasional capability announcement. Double opt-in. One click to unsubscribe.",
  },
  he: {
    title: "הרשמה — תדריכי סימנטיק",
    description:
      "הירשמו לתדריכי סימנטיק — עדכונים נדירים ושקטים מאולפן הנדסה לונדוני: הערות שיגור, פירוקי תשתית והכרזות יכולת מדי פעם. הצטרפות בשני שלבים. ביטול בלחיצה אחת.",
  },
  ru: {
    title: "Подписка — рассылка Simnetiq",
    description:
      "Подпишитесь на рассылку Simnetiq — редкие, тихие обновления из лондонской инженерной студии: заметки о релизах, разборы инфраструктуры и иногда — новые услуги. Двойное подтверждение. Отписка в один клик.",
  },
};

const UNSUBSCRIBE: RouteCopy = {
  en: {
    title: "Unsubscribe — Simnetiq",
    description:
      "Unsubscribe from Simnetiq emails. One click and we'll never write again.",
  },
  he: {
    title: "ביטול הרשמה — סימנטיק",
    description:
      "ביטול הרשמה למיילים של סימנטיק. לחיצה אחת ולא נכתוב שוב.",
  },
  ru: {
    title: "Отписаться — Simnetiq",
    description:
      "Отписка от писем Simnetiq. Один клик — и мы больше не пишем.",
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

export const ROUTE_COPY = {
  home: HOME,
  about: ABOUT,
  projects: PROJECTS,
  services: SERVICES,
  subscribe: SUBSCRIBE,
  unsubscribe: UNSUBSCRIBE,
  caseStudyDoppler: CASE_DOPPLER,
  caseStudyPhysics: CASE_PHYSICS,
  caseStudyGreenFlagged: CASE_GREENFLAGGED,
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
