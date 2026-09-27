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
      "Meet Simnetiq, a London software studio building mobile and desktop apps, web platforms and business automation. Learn about our team and how we work.",
  },
  he: {
    title: "אודות סימנטיק — סטודיו תוכנה בלונדון",
    description:
      "הכירו את סימנטיק, סטודיו תוכנה בלונדון שמפתח אפליקציות לנייד ולמחשב, פלטפורמות ווב ואוטומציה עסקית. מידע על הצוות ועל הדרך שבה אנחנו עובדים.",
  },
  ru: {
    title: "О Simnetiq — лондонская студия разработки",
    description:
      "Simnetiq — лондонская студия разработки приложений, веб-платформ и автоматизации бизнеса. Познакомьтесь с командой и узнайте, как мы работаем.",
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
    title: "App Development, Web Platforms & AI Automation",
    description:
      "Mobile and desktop apps, websites and SaaS platforms, and AI automation from Simnetiq, a London software studio. Build customer tools and reduce manual work.",
  },
  he: {
    title: "פיתוח אפליקציות, פלטפורמות ווב ואוטומציה עם AI",
    description:
      "אפליקציות לנייד ולמחשב, אתרים, פלטפורמות SaaS ואוטומציה עם AI מבית סימנטיק, סטודיו תוכנה בלונדון. בונים כלים ללקוחות ומצמצמים עבודה ידנית.",
  },
  ru: {
    title: "Разработка приложений, веб-платформы и AI-автоматизация",
    description:
      "Мобильные и десктопные приложения, сайты, SaaS-платформы и AI-автоматизация от лондонской студии Simnetiq. Создаём инструменты для клиентов и сокращаем ручную работу.",
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
      "Green Flagged is an AI contract reviewer for freelancers and small teams. Drop a PDF or paste contract text and get a plain-language verdict — flagged clauses, severity grades, and suggested redlines — in under eight minutes. Built around an editorial / spec-sheet aesthetic with a light-first token system.",
  },
  he: {
    title: "Green Flagged — מקרה בוחן",
    description:
      "Green Flagged הוא סוקר חוזים מבוסס AI לפרילנסרים וצוותים קטנים. גוררים PDF או מדביקים טקסט חוזה ומקבלים פסיקה בשפה פשוטה — סעיפים מסומנים, דרגות חומרה והצעות לתיקון — בפחות משמונה דקות. עיצוב במראה של דף מפרט עריכתי עם מערכת טוקנים שמתחילה במצב בהיר.",
  },
  ru: {
    title: "Green Flagged — кейс",
    description:
      "Green Flagged — AI-ревьюер контрактов для фрилансеров и небольших команд. Загрузите PDF или вставьте текст договора и получите вердикт простым языком — отмеченные пункты, оценку рисков и предложения правок — менее чем за восемь минут. Построен на редакторско-спецификационной эстетике со светлой токен-системой.",
  },
};

const CASE_SMSCODE: RouteCopy = {
  en: {
    title: "SMS Code — Case Study",
    description:
      "SMS Code by SIMNETIQ hands you a real carrier number in 150+ countries for exactly as long as a verification code takes to arrive. 100+ services from Telegram to Steam, codes in about thirty seconds, single-use numbers, and one-time coin packs that never expire — no SIM, no eSIM, no subscription, no personal number handed over. Formerly SMS Activate. Web and iOS.",
  },
  he: {
    title: "SMS Code — מקרה בוחן",
    description:
      "SMS Code מבית SIMNETIQ נותן לך מספר אמיתי ברשת סלולרית ביותר מ-150 מדינות בדיוק לפרק הזמן שלוקח לקוד אימות להגיע. יותר מ-100 שירותים — מטלגרם ועד סטים, קודים בתוך כשלושים שניות, מספרים לשימוש חד-פעמי וחבילות מטבעות חד-פעמיות שאינן פגות תוקף — בלי SIM, בלי eSIM, בלי מנוי ובלי למסור את המספר האישי. לשעבר SMS Activate. ווב ו-iOS.",
  },
  ru: {
    title: "SMS Code — кейс",
    description:
      "SMS Code от SIMNETIQ выдаёт настоящий номер оператора в 150+ странах ровно на то время, которое нужно коду подтверждения. 100+ сервисов — от Telegram до Steam, код приходит примерно за тридцать секунд, номера одноразовые, а разовые пакеты монет не сгорают — без SIM, без eSIM, без подписки и без передачи личного номера. Ранее — SMS Activate. Веб и iOS.",
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

const CASE_ARGUS: RouteCopy = {
  en: {
    title: "Argus Browser — Case Study",
    description:
      "Argus Browser is an anti-detect browser built on a custom Chromium fork. The identity — fingerprint, WebRTC address and cookie jar — is applied below the page, inside the engine, where a script cannot read around it. A desktop control plane owns the profiles, proxies, cookie sets, automations, schedules and datasets, and hands each browser session one launch payload and nothing more. Signed and notarised builds for macOS (Apple Silicon) and Windows, with MCP and a local HTTP API for driving it from your own tooling.",
  },
  he: {
    title: "Argus Browser — מקרה בוחן",
    description:
      "Argus Browser הוא דפדפן אנטי-דיטקט הבנוי על fork ייעודי של Chromium. הזהות — טביעת האצבע, כתובת ה-WebRTC ומאגר העוגיות — מוחלת מתחת לדף, בתוך המנוע עצמו, במקום שסקריפט אינו יכול לעקוף. אפליקציית שליטה שולחנית מחזיקה את הפרופילים, הפרוקסי, ערכות העוגיות, האוטומציות, לוחות הזמנים ומאגרי הנתונים, ומוסרת לכל הפעלת דפדפן מטען שיגור אחד בלבד ולא יותר מכך. גרסאות חתומות ומאושרות ל-macOS (Apple Silicon) ול-Windows, עם MCP ו-API מקומי להנעת המערכת מתוך הכלים שלכם.",
  },
  ru: {
    title: "Argus Browser — кейс",
    description:
      "Argus Browser — анти-детект браузер на собственном форке Chromium. Личность профиля — отпечаток, адрес WebRTC и хранилище cookie — применяется под страницей, внутри самого движка, где скрипт не может её обойти. Настольная панель управления владеет профилями, прокси, наборами cookie, автоматизациями, расписаниями и таблицами данных и передаёт каждой сессии браузера ровно один стартовый пакет и ничего сверх того. Подписанные и нотаризованные сборки для macOS (Apple Silicon) и Windows, с MCP и локальным HTTP API для управления из собственных инструментов.",
  },
};

const HOW_WE_WORK: RouteCopy = {
  en: {
    title: "How We Work — Scope, Ownership, Support",
    description:
      "How Simnetiq builds software: direct access to developers, an agreed scope and price, ownership of your code, and support after launch.",
  },
  he: {
    title: "איך אנחנו עובדים — אפיון, בעלות, תמיכה",
    description:
      "איך עובדים עם סימנטיק: קשר ישיר עם המפתחים, היקף עבודה ומחיר שסוכמו מראש, בעלות על הקוד ותמיכה אחרי ההשקה.",
  },
  ru: {
    title: "Как мы работаем — объём, права, поддержка",
    description:
      "Как Simnetiq разрабатывает ПО: прямое общение с разработчиками, согласованные объём и цена, ваши права на код и поддержка после запуска.",
  },
};

const HWW_ENGINEERS: RouteCopy = {
  en: {
    title: "Work Directly With the Engineers Who Build It",
    description:
      "Work directly with the Simnetiq developer who plans and builds your software. Learn how we handle estimates, communication, availability and project handover.",
  },
  he: {
    title: "עובדים ישירות מול המהנדסים שבונים",
    description:
      "עובדים ישירות עם המפתח שמאפיין ובונה את התוכנה שלכם בסימנטיק. כך אנחנו מתאמים הערכות, תקשורת וזמינות ומכינים את הפרויקט להעברה בעת הצורך.",
  },
  ru: {
    title: "Работа напрямую с инженерами, которые пишут код",
    description:
      "Работайте напрямую с разработчиком Simnetiq, который планирует и создаёт ваш продукт. Узнайте об оценке задач, общении, доступности и передаче проекта.",
  },
};

const HWW_SCOPE: RouteCopy = {
  en: {
    title: "Fixed-Price Development Against a Signed SOW",
    description:
      "Agree software deliverables, milestones and a fixed price in GBP before development starts. See how Simnetiq documents scope and handles requested changes.",
  },
  he: {
    title: "מחיר קבוע מול מסמך עבודה חתום",
    description:
      "מסכמים תוצרים, אבני דרך ומחיר קבוע בליש״ט לפני תחילת הפיתוח. כך סימנטיק מגדירה את היקף העבודה במסמך חתום ומטפלת בבקשות לשינוי.",
  },
  ru: {
    title: "Фиксированная цена по подписанному SOW",
    description:
      "Согласуйте результаты, этапы и фиксированную цену в GBP до начала разработки. Как Simnetiq оформляет объём работ и обрабатывает запросы на изменения.",
  },
};

const HWW_OWNERSHIP: RouteCopy = {
  en: {
    title: "Who Owns the Code When You Hire an Agency",
    description:
      "Your software source code stays in your repository from the first commit. Learn how Simnetiq handles account ownership, hosting, licences and project handover.",
  },
  he: {
    title: "למי שייך הקוד כשמעסיקים סוכנות פיתוח",
    description:
      "קוד התוכנה נמצא במאגר שלכם מהקומיט הראשון. כך סימנטיק מסדירה בעלות על חשבונות, אירוח, רישיונות והעברת הפרויקט למפתח אחר.",
  },
  ru: {
    title: "Кому принадлежит код, если нанять агентство",
    description:
      "Исходный код — в вашем репозитории с первого коммита. Как Simnetiq оформляет права на аккаунты, хостинг, лицензии и передачу проекта другому разработчику.",
  },
};

const HWW_SUPPORT: RouteCopy = {
  en: {
    title: "Software Support and Maintenance After Launch",
    description:
      "Software support after launch: monitoring, bug fixes, security updates and app store releases. See how Simnetiq separates maintenance from new development.",
  },
  he: {
    title: "תמיכה ותחזוקת תוכנה אחרי ההשקה",
    description:
      "תמיכה בתוכנה אחרי ההשקה: ניטור, תיקון תקלות, עדכוני אבטחה וגרסאות לחנויות האפליקציות. כך סימנטיק מגדירה מה כלול בתחזוקה ומה דורש פיתוח חדש.",
  },
  ru: {
    title: "Поддержка и сопровождение софта после запуска",
    description:
      "Поддержка ПО после запуска: мониторинг, исправление ошибок, обновления безопасности и выпуск приложений. Что входит в обслуживание, а что требует новой разработки.",
  },
};

const SUBSCRIBE: RouteCopy = {
  en: {
    title: "Email Updates — Simnetiq",
    description: "Subscribe to Simnetiq product news and studio updates. Confirm your email to join and unsubscribe at any time.",
  },
  he: {
    title: "עדכונים בדוא״ל — סימנטיק",
    description: "הרשמה לחדשות מוצרים ולעדכונים מסימנטיק. מאשרים את כתובת הדוא״ל להצטרפות ואפשר להסיר את ההרשמה בכל עת.",
  },
  ru: {
    title: "Новости по почте — Simnetiq",
    description: "Подпишитесь на новости продуктов и студии Simnetiq. Подтвердите адрес для подписки. Отписаться можно в любое время.",
  },
};

const UNSUBSCRIBE: RouteCopy = {
  en: {
    title: "Email Preferences — Simnetiq",
    description: "Manage your Simnetiq email preferences and unsubscribe from marketing emails.",
  },
  he: {
    title: "העדפות דוא״ל — סימנטיק",
    description: "ניהול העדפות הדוא״ל והסרה מהודעות שיווקיות של סימנטיק.",
  },
  ru: {
    title: "Настройки рассылки — Simnetiq",
    description: "Управление настройками почты и отказ от маркетинговых писем Simnetiq.",
  },
};

export const ROUTE_COPY = {
  home: HOME,
  about: ABOUT,
  projects: PROJECTS,
  services: SERVICES,
  subscribe: SUBSCRIBE,
  unsubscribe: UNSUBSCRIBE,
  howWeWork: HOW_WE_WORK,
  howWeWorkEngineers: HWW_ENGINEERS,
  howWeWorkScope: HWW_SCOPE,
  howWeWorkOwnership: HWW_OWNERSHIP,
  howWeWorkSupport: HWW_SUPPORT,
  caseStudyArgus: CASE_ARGUS,
  caseStudyDoppler: CASE_DOPPLER,
  caseStudyPhysics: CASE_PHYSICS,
  caseStudyGreenFlagged: CASE_GREENFLAGGED,
  caseStudySmsCode: CASE_SMSCODE,
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
  /**
   * Intrinsic size of `ogImage`. Defaults to the 1200x630 the shared card and
   * the case-study headers use; pass explicitly for artwork of another shape,
   * because a declared size that disagrees with the file makes scrapers lay
   * the card out against the wrong box.
   */
  ogImageWidth?: number;
  ogImageHeight?: number;
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
  ogImageWidth = 1200,
  ogImageHeight = 630,
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
  // The case-study headers are AVIF while the shared fallback card is PNG.
  // Declaring the wrong type here is not fatal, but scrapers do read it.
  const imageType = image.endsWith(".avif")
    ? "image/avif"
    : image.endsWith(".webp")
      ? "image/webp"
      : image.endsWith(".jpg") || image.endsWith(".jpeg")
        ? "image/jpeg"
        : "image/png";

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
          width: ogImageWidth,
          height: ogImageHeight,
          alt: copy.title,
          type: imageType,
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
