import {
  getServices,
  getServiceFullTitle,
  type Service,
} from "@/lib/services";
import { ROUTE_COPY } from "@/lib/seo-meta";
import type { Locale } from "@/lib/i18n";

const SITE_URL = "https://simnetiq.store";

type Phrasebook = {
  intro: string;
  postIntro: string;
  servicesHeading: string;
  projectsHeading: string;
  projectLines: (url: (path: string) => string) => string[];
  companyHeading: string;
  about: string;
  servicesOverview: string;
  projectsIndex: string;
  contactHeading: string;
  registeredOffice: string;
  companiesHouse: string;
  bookingLine: string;
  optionalHeading: string;
  legalNotice: string;
  privacyPolicy: string;
  alternateLocaleLines: string[];
  llmsFullLine: string;
  sitemapLine: string;
  fullTitle: string;
  fullIntro: string;
  fullCanonical: string;
  fullLastGenerated: string;
  fullSeeAlso: string;
  homeHeading: string;
  liveDeploymentsHeading: string;
  liveDeployments: () => string[];
  homeNarrative: string;
  aboutHeading: string;
  companyRegistrationHeading: string;
  companyRegistrationLines: string[];
  teamHeading: string;
  teamLines: string[];
  operatingPrinciplesHeading: string;
  operatingPrinciples: string[];
  servicesPageHeading: string;
  projectsPageHeading: string;
  dopplerHeading: string;
  dopplerStack: string;
  dopplerStatus: string;
  physicsHeading: string;
  physicsStack: string;
  physicsStatus: string;
  creatorHeading: string;
  creatorStatus: string;
  creatorStack: string;
  goDeliveryHeading: string;
  goDeliveryStatus: string;
  goDeliveryStack: string;
  greenFlaggedHeading: string;
  greenFlaggedStatus: string;
  greenFlaggedStack: string;
  contactBookingHeading: string;
  contactLines: (url: string) => string[];
  machineRefsHeading: string;
  machineRefs: (url: string) => string[];
  subServicesLabel: string;
  techStackLabel: string;
  pricingLabel: string;
  metaLabel: string;
  badgeLabel: string;
  taglineLabel: string;
  urlLabel: string;
  titleLabel: string;
};

const PHRASEBOOK: Record<Locale, Phrasebook> = {
  en: {
    intro:
      "Simnetiq Ltd is a London-based software engineering and growth marketing studio. We build production iOS, Android, macOS, Windows and Linux applications; Next.js / Supabase / Stripe web platforms; LLM, RAG and agentic automation on Anthropic, OpenAI and open-weight models; paid acquisition on Meta, TikTok and Google wired to AppsFlyer and Adjust attribution; and censorship-resistant VPN infrastructure on VLESS-Reality. Three owner-operators, registered in England & Wales (Companies House 16861177), 2 Frederick Street, Kings Cross, London WC1X 0ND.",
    postIntro:
      "Every engagement is priced in GBP against a signed SOW. Brief to production, end-to-end. No agency retainers, no black-box reporting.",
    servicesHeading: "Services",
    projectsHeading: "Projects",
    projectLines: (url) => [
      `- [Doppler VPN](${url("/projects/doppler-vpn")}): Censorship-resistant VPN on VLESS-Reality with native iOS, Android, macOS and Windows clients. Zero-log, zero-registration, indistinguishable from HTTPS.`,
      `- [Physics.explained](${url("/projects/physics-explained")}): Open-source interactive physics encyclopedia with unit-tested ODE solvers, WebGL visualisations and an AI tutor at /ask grounded in the library.`,
      `- [Green Flagged](${url("/projects/green-flagged")}): AI contract reviewer for freelancers and small teams. Drop a PDF, get a plain-language verdict with flagged clauses, severity grades and suggested redlines in under eight minutes. Marketing site live, scanning engine in development.`,
      `- [Creator AI](https://www.creatorai.art/en): Multi-language LLM content platform on Anthropic and OpenAI. Editorial pipelines, native iOS and Android clients.`,
      `- [Go Delivery / ISR Shipping](https://www.isrshipping.com): Logistics platform with real-time GPS driver tracking, route optimisation and full order lifecycle management.`,
    ],
    companyHeading: "Company",
    about: "About Simnetiq",
    servicesOverview: "Services overview",
    projectsIndex: "Projects index",
    contactHeading: "Contact",
    registeredOffice:
      "Registered office: Simnetiq Ltd, 2 Frederick Street, Kings Cross, London WC1X 0ND, United Kingdom",
    companiesHouse: "Companies House: 16861177 (England & Wales)",
    bookingLine: "Booking",
    optionalHeading: "Optional",
    legalNotice: "Legal notice",
    privacyPolicy: "Privacy policy",
    alternateLocaleLines: [
      `- [Hebrew (he-IL) version](${SITE_URL}/he)`,
      `- [Russian (ru-RU) version](${SITE_URL}/ru)`,
    ],
    llmsFullLine: "Full inlined content for single-fetch consumption.",
    sitemapLine: "Sitemap",
    fullTitle: "Simnetiq — Full Content (llms-full.txt)",
    fullIntro:
      "Inlined content of every primary page on simnetiq.store, in Markdown, for single-fetch consumption by AI agents.",
    fullCanonical: "Canonical site",
    fullLastGenerated: "Last generated",
    fullSeeAlso: "See also",
    homeHeading: "Home",
    liveDeploymentsHeading:
      "Live deployments referenced from the homepage",
    liveDeployments: () => [
      `- **Doppler VPN** (https://dopplervpn.org) — Custom VLESS-Reality VPN with zero-log geo-distributed nodes. Native iOS and Android clients.`,
      `- **Physics.explained** (https://physics.it.com/) — Open-source interactive physics learning platform with accurate ODE solvers and a concepts dictionary.`,
      `- **Creator AI** (https://www.creatorai.art/en) — Neural content synthesis platform. Multi-language editorial pipelines on Anthropic and OpenAI.`,
      `- **Go Delivery / ISR Shipping** (https://www.isrshipping.com) — Logistics platform with real-time GPS driver tracking, route optimisation and order lifecycle management.`,
    ],
    homeNarrative:
      "Simnetiq is a small London studio of three owner-operators. We deliver software end-to-end: native mobile and desktop apps, web platforms, AI features and pipelines, paid acquisition campaigns wired to real attribution, and bespoke VPN infrastructure. Each engagement is scoped, priced in GBP, and signed as a SOW before code is written.",
    aboutHeading: "About",
    companyRegistrationHeading: "Company registration",
    companyRegistrationLines: [
      "- **Legal name:** Simnetiq Ltd",
      "- **Company number:** 16861177",
      "- **Jurisdiction:** Registered in England & Wales",
      "- **VAT status:** Not VAT-registered (under threshold)",
      "- **Registered address:** Simnetiq Ltd, 2 Frederick Street, Kings Cross, London WC1X 0ND, United Kingdom",
      "- **Founded:** 2025",
      "- **Operations:** London, United Kingdom (51.5074°N · 0.1278°W)",
    ],
    teamHeading: "Team (three owner-operators)",
    teamLines: [
      "01 — Director / Engineering — Roman Pochtman — Mobile, web, AI, infrastructure",
      "02 — Director / Engineering — Dmitry Polskoy — Backend, automation, growth wiring",
      "03 — Director / Legal & Operations — David Zitomirsky — Contracts, compliance, finance",
    ],
    operatingPrinciplesHeading: "Operating principles",
    operatingPrinciples: [
      "- Every engagement priced in GBP against a signed SOW. No retainers without a defined deliverable.",
      "- Production-first: we write the code that survives in production, not demoware.",
      "- Owner-operator delivery: the people you brief are the people who write and ship the code.",
      "- Observability and CI/CD shipped from day one of every project.",
      "- Native where it matters; cross-platform where it doesn't.",
    ],
    servicesPageHeading: "Services",
    projectsPageHeading: "Projects",
    dopplerHeading: "Doppler VPN",
    dopplerStack:
      "Stack: Swift (iOS), Kotlin (Android), Go (server), Marzban control plane, VLESS-Reality protocol.",
    dopplerStatus:
      "Status: Production. Native apps on iOS, Android, macOS and Windows. Card and crypto payments. No registration, no logs.",
    physicsHeading: "Physics.explained",
    physicsStack:
      "Stack: Next.js, WebGL, MathJax, custom unit-tested ODE solvers, AI tutor (Anthropic Claude) at /ask.",
    physicsStatus:
      "Status: Open-source. Live encyclopedia spanning classical mechanics, electromagnetism, thermodynamics, relativity, quantum and modern physics.",
    creatorHeading: "Creator AI",
    creatorStatus:
      "Status: Production. Multi-language LLM content platform on Anthropic and OpenAI. Native iOS and Android clients, dedicated Supabase backend.",
    creatorStack: "Stack: Swift, Kotlin, Python, Supabase.",
    goDeliveryHeading: "Go Delivery / ISR Shipping",
    goDeliveryStatus:
      "Status: Production. Israeli logistics platform with real-time GPS driver tracking, route optimisation, and order lifecycle management.",
    goDeliveryStack: "Stack: Next.js, React, Node.js, PostgreSQL.",
    greenFlaggedHeading: "Green Flagged",
    greenFlaggedStatus:
      "Status: In development. Marketing site live at greenflagged.com; scan API not yet wired. Pre-launch, first scan free.",
    greenFlaggedStack:
      "Stack: Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4, Radix UI primitives, GSAP, pnpm.",
    contactBookingHeading: "Contact & booking",
    contactLines: (url) => [
      `- **Book an intro call:** Cal.com widget on ${url}`,
      `- **Registered office:** Simnetiq Ltd, 2 Frederick Street, Kings Cross, London WC1X 0ND, United Kingdom`,
      `- **Companies House:** 16861177 (England & Wales)`,
      `- **Languages served:** English (en-GB), Hebrew (he-IL), Russian (ru-RU)`,
    ],
    machineRefsHeading: "Machine-readable references",
    machineRefs: () => [
      `- Index for AI agents: ${SITE_URL}/llms.txt`,
      `- Full content (this file): ${SITE_URL}/llms-full.txt`,
      `- XML sitemap: ${SITE_URL}/sitemap.xml`,
      `- robots.txt: ${SITE_URL}/robots.txt`,
    ],
    subServicesLabel: "Sub-services",
    techStackLabel: "Tech stack",
    pricingLabel: "Pricing tiers",
    metaLabel: "Meta",
    badgeLabel: "Badge",
    taglineLabel: "Tagline",
    urlLabel: "URL",
    titleLabel: "Title",
  },
  he: {
    intro:
      "Simnetiq Ltd הוא אולפן הנדסת תוכנה ושיווק צמיחה מבוסס לונדון. אנחנו בונים אפליקציות ייצור ל-iOS, Android, macOS, Windows ו-Linux; פלטפורמות ווב על Next.js / Supabase / Stripe; אוטומציה של LLM, RAG ו-Agentic על מודלים של Anthropic, OpenAI ו-open-weight; רכישה ממומנת ב-Meta, TikTok וגוגל המחוברת לייחוס AppsFlyer ו-Adjust; ותשתית VPN עמידה לצנזורה על VLESS-Reality. שלושה שותפים-מפעילים, רשומים באנגליה ובוויילס (Companies House 16861177), 2 Frederick Street, Kings Cross, London WC1X 0ND.",
    postIntro:
      "כל התקשרות מתומחרת ב-GBP מול SOW חתום. מתיק עד ייצור, מקצה לקצה. ללא ריטיינרים סוכנותיים, ללא דיווח קופסה שחורה.",
    servicesHeading: "שירותים",
    projectsHeading: "פרויקטים",
    projectLines: (url) => [
      `- [Doppler VPN](${url("/projects/doppler-vpn")}): VPN עמיד לצנזורה על VLESS-Reality עם לקוחות מקוריים ל-iOS, Android, macOS ו-Windows. ללא לוגים, ללא רישום, בלתי ניתן להבחנה מ-HTTPS.`,
      `- [Physics.explained](${url("/projects/physics-explained")}): אנציקלופדיית פיזיקה אינטראקטיבית בקוד פתוח עם פותרי ODE עם בדיקות יחידה, ויזואליזציות WebGL ומורה AI ב-/ask המבוסס על הספרייה.`,
      `- [Green Flagged](${url("/projects/green-flagged")}): סוקר חוזים מבוסס AI לפרילנסרים וצוותים קטנים. גוררים PDF ומקבלים פסיקה בשפה פשוטה — סעיפים מסומנים, דרגות חומרה והצעות לתיקון — בפחות משמונה דקות. אתר השיווק עלה, מנוע הסריקה בפיתוח.`,
      `- [Creator AI](https://www.creatorai.art/en): פלטפורמת תוכן LLM רב-לשונית על Anthropic ו-OpenAI. צנרת עריכה, לקוחות מקוריים ל-iOS ו-Android.`,
      `- [Go Delivery / ISR Shipping](https://www.isrshipping.com): פלטפורמת לוגיסטיקה עם מעקב נהגים בזמן אמת ב-GPS, אופטימיזציית מסלולים וניהול מחזור חיי הזמנה מלא.`,
    ],
    companyHeading: "החברה",
    about: "אודות סימנטיק",
    servicesOverview: "סקירת שירותים",
    projectsIndex: "מדד פרויקטים",
    contactHeading: "יצירת קשר",
    registeredOffice:
      "כתובת רשומה: Simnetiq Ltd, 2 Frederick Street, Kings Cross, London WC1X 0ND, United Kingdom",
    companiesHouse: "Companies House: 16861177 (אנגליה ווויילס)",
    bookingLine: "הזמנה",
    optionalHeading: "אופציונלי",
    legalNotice: "הודעה משפטית",
    privacyPolicy: "מדיניות פרטיות",
    alternateLocaleLines: [
      `- [גרסה אנגלית (en-GB)](${SITE_URL}/en)`,
      `- [גרסה רוסית (ru-RU)](${SITE_URL}/ru)`,
    ],
    llmsFullLine: "תוכן מלא משובץ לצריכה בבקשה אחת.",
    sitemapLine: "מפת אתר",
    fullTitle: "Simnetiq — תוכן מלא (llms-full.txt)",
    fullIntro:
      "תוכן משובץ של כל עמוד עיקרי ב-simnetiq.store, ב-Markdown, לצריכה בבקשה אחת על ידי סוכני AI.",
    fullCanonical: "אתר קנוני",
    fullLastGenerated: "נוצר לאחרונה",
    fullSeeAlso: "ראו גם",
    homeHeading: "בית",
    liveDeploymentsHeading: "פריסות חיות בעמוד הבית",
    liveDeployments: () => [
      `- **Doppler VPN** (https://dopplervpn.org) — VPN VLESS-Reality מותאם אישית עם צמתים גיאו-מבוזרים ללא לוגים. לקוחות מקוריים ל-iOS ו-Android.`,
      `- **Physics.explained** (https://physics.it.com/) — פלטפורמת לימוד פיזיקה אינטראקטיבית בקוד פתוח עם פותרי ODE מדויקים ומילון מושגים.`,
      `- **Creator AI** (https://www.creatorai.art/en) — פלטפורמת סינתזת תוכן נוירונית. צנרת עריכה רב-לשונית על Anthropic ו-OpenAI.`,
      `- **Go Delivery / ISR Shipping** (https://www.isrshipping.com) — פלטפורמת לוגיסטיקה עם מעקב נהגים בזמן אמת ב-GPS, אופטימיזציית מסלולים וניהול מחזור חיי הזמנה.`,
    ],
    homeNarrative:
      "סימנטיק הוא אולפן לונדוני קטן של שלושה שותפים-מפעילים. אנו מספקים תוכנה מקצה לקצה: אפליקציות מובייל ושולחן עבודה מקוריות, פלטפורמות ווב, פיצ'רי AI וצנרות, קמפייני רכישה ממומנת מחוברים לייחוס אמיתי, ותשתית VPN ייעודית. כל התקשרות מוגדרת, מתומחרת ב-GBP, ונחתמת כ-SOW לפני שנכתב קוד.",
    aboutHeading: "אודות",
    companyRegistrationHeading: "רישום החברה",
    companyRegistrationLines: [
      "- **שם משפטי:** Simnetiq Ltd",
      "- **מספר חברה:** 16861177",
      "- **תחום שיפוט:** רשום באנגליה ובוויילס",
      "- **סטטוס מע״מ:** לא רשום למע״מ (מתחת לסף)",
      "- **כתובת רשומה:** Simnetiq Ltd, 2 Frederick Street, Kings Cross, London WC1X 0ND, United Kingdom",
      "- **שנת ייסוד:** 2025",
      "- **פעילות:** לונדון, בריטניה (51.5074°N · 0.1278°W)",
    ],
    teamHeading: "צוות (שלושה שותפים-מפעילים)",
    teamLines: [
      "01 — דירקטור / הנדסה — Roman Pochtman — מובייל, ווב, AI, תשתית",
      "02 — דירקטור / הנדסה — Dmitry Polskoy — בקאנד, אוטומציה, חיווט גרואת'",
      "03 — דירקטור / משפט ותפעול — David Zitomirsky — חוזים, ציות, פיננסים",
    ],
    operatingPrinciplesHeading: "עקרונות תפעוליים",
    operatingPrinciples: [
      "- כל התקשרות מתומחרת ב-GBP מול SOW חתום. ללא ריטיינרים ללא תוצר מוגדר.",
      "- ייצור קודם: אנחנו כותבים קוד ששורד בייצור, לא דמו.",
      "- אספקה על ידי בעלי-מפעילים: האנשים שמדברים עם הלקוח הם אלה שכותבים ומשגרים את הקוד.",
      "- ניטור ו-CI/CD מהיום הראשון של כל פרויקט.",
      "- מקורי במקום שזה חשוב; קרוס-פלטפורמה במקום שלא.",
    ],
    servicesPageHeading: "שירותים",
    projectsPageHeading: "פרויקטים",
    dopplerHeading: "Doppler VPN",
    dopplerStack:
      "סטאק: Swift (iOS), Kotlin (Android), Go (שרת), בקרת Marzban, פרוטוקול VLESS-Reality.",
    dopplerStatus:
      "סטטוס: ייצור. אפליקציות מקוריות ל-iOS, Android, macOS ו-Windows. תשלומי כרטיס וקריפטו. ללא רישום, ללא לוגים.",
    physicsHeading: "Physics.explained",
    physicsStack:
      "סטאק: Next.js, WebGL, MathJax, פותרי ODE מותאמים עם בדיקות יחידה, מורה AI (Anthropic Claude) ב-/ask.",
    physicsStatus:
      "סטטוס: קוד פתוח. אנציקלופדיה חיה המקיפה מכניקה קלאסית, אלקטרומגנטיות, תרמודינמיקה, יחסות, קוונטים ופיזיקה מודרנית.",
    creatorHeading: "Creator AI",
    creatorStatus:
      "סטטוס: ייצור. פלטפורמת תוכן LLM רב-לשונית על Anthropic ו-OpenAI. לקוחות מקוריים ל-iOS ו-Android, בקאנד Supabase ייעודי.",
    creatorStack: "סטאק: Swift, Kotlin, Python, Supabase.",
    goDeliveryHeading: "Go Delivery / ISR Shipping",
    goDeliveryStatus:
      "סטטוס: ייצור. פלטפורמת לוגיסטיקה ישראלית עם מעקב נהגים בזמן אמת ב-GPS, אופטימיזציית מסלולים וניהול מחזור חיי הזמנה.",
    goDeliveryStack: "סטאק: Next.js, React, Node.js, PostgreSQL.",
    greenFlaggedHeading: "Green Flagged",
    greenFlaggedStatus:
      "סטטוס: בפיתוח. אתר השיווק עלה ב-greenflagged.com; API הסריקה עוד לא חובר. טרום-השקה, סריקה ראשונה חינם.",
    greenFlaggedStack:
      "סטאק: Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4, רכיבי Radix UI, GSAP, pnpm.",
    contactBookingHeading: "יצירת קשר והזמנה",
    contactLines: (url) => [
      `- **הזמנת שיחת היכרות:** ווידג'ט Cal.com ב-${url}`,
      `- **כתובת רשומה:** Simnetiq Ltd, 2 Frederick Street, Kings Cross, London WC1X 0ND, United Kingdom`,
      `- **Companies House:** 16861177 (אנגליה ווויילס)`,
      `- **שפות נתמכות:** אנגלית (en-GB), עברית (he-IL), רוסית (ru-RU)`,
    ],
    machineRefsHeading: "הפניות קריאות-מכונה",
    machineRefs: () => [
      `- מדד לסוכני AI: ${SITE_URL}/llms.txt`,
      `- תוכן מלא (קובץ זה): ${SITE_URL}/llms-full.txt`,
      `- מפת XML: ${SITE_URL}/sitemap.xml`,
      `- robots.txt: ${SITE_URL}/robots.txt`,
    ],
    subServicesLabel: "תתי-שירותים",
    techStackLabel: "סטאק טכנולוגי",
    pricingLabel: "שכבות תמחור",
    metaLabel: "מטא",
    badgeLabel: "תג",
    taglineLabel: "כותרת משנה",
    urlLabel: "כתובת",
    titleLabel: "כותרת",
  },
  ru: {
    intro:
      "Simnetiq Ltd — лондонская студия разработки ПО и growth-маркетинга. Мы собираем production-приложения для iOS, Android, macOS, Windows и Linux; веб-платформы на Next.js / Supabase / Stripe; LLM, RAG и агентную автоматизацию на моделях Anthropic, OpenAI и open-weight; платный трафик в Meta, TikTok и Google с атрибуцией через AppsFlyer и Adjust; устойчивую к цензуре VPN-инфраструктуру на VLESS-Reality. Три владельца-практика, регистрация в Англии и Уэльсе (Companies House 16861177), 2 Frederick Street, Kings Cross, London WC1X 0ND.",
    postIntro:
      "Каждый контракт оценивается в GBP по подписанному SOW. От брифа до продакшена, от и до. Без агентских ретейнеров, без чёрно-ящичных отчётов.",
    servicesHeading: "Услуги",
    projectsHeading: "Проекты",
    projectLines: (url) => [
      `- [Doppler VPN](${url("/projects/doppler-vpn")}): Устойчивый к цензуре VPN на VLESS-Reality с нативными клиентами для iOS, Android, macOS и Windows. Без логов, без регистрации, неотличим от HTTPS.`,
      `- [Physics.explained](${url("/projects/physics-explained")}): Open-source интерактивная энциклопедия физики с покрытыми тестами решателями ОДУ, WebGL-визуализациями и AI-репетитором на /ask, основанным на материалах библиотеки.`,
      `- [Green Flagged](${url("/projects/green-flagged")}): AI-ревьюер контрактов для фрилансеров и небольших команд. Загрузите PDF и получите вердикт простым языком — отмеченные пункты, оценку рисков и предложения правок — менее чем за восемь минут. Маркетинговый сайт запущен, движок сканирования в разработке.`,
      `- [Creator AI](https://www.creatorai.art/en): Многоязычная LLM-платформа контента на Anthropic и OpenAI. Редакторские пайплайны, нативные клиенты iOS и Android.`,
      `- [Go Delivery / ISR Shipping](https://www.isrshipping.com): Логистическая платформа с GPS-трекингом водителей в реальном времени, оптимизацией маршрутов и полным циклом управления заказами.`,
    ],
    companyHeading: "Компания",
    about: "О Simnetiq",
    servicesOverview: "Обзор услуг",
    projectsIndex: "Список проектов",
    contactHeading: "Контакты",
    registeredOffice:
      "Юридический адрес: Simnetiq Ltd, 2 Frederick Street, Kings Cross, London WC1X 0ND, United Kingdom",
    companiesHouse: "Companies House: 16861177 (Англия и Уэльс)",
    bookingLine: "Запись на встречу",
    optionalHeading: "Дополнительно",
    legalNotice: "Юридическая информация",
    privacyPolicy: "Политика конфиденциальности",
    alternateLocaleLines: [
      `- [Английская версия (en-GB)](${SITE_URL}/en)`,
      `- [Версия на иврите (he-IL)](${SITE_URL}/he)`,
    ],
    llmsFullLine: "Полный встроенный контент для одного запроса.",
    sitemapLine: "Карта сайта",
    fullTitle: "Simnetiq — Полный контент (llms-full.txt)",
    fullIntro:
      "Встроенный контент каждой основной страницы simnetiq.store в Markdown — для одного запроса AI-агентами.",
    fullCanonical: "Канонический сайт",
    fullLastGenerated: "Последняя генерация",
    fullSeeAlso: "См. также",
    homeHeading: "Главная",
    liveDeploymentsHeading:
      "Живые продакшен-, упомянутые на главной",
    liveDeployments: () => [
      `- **Doppler VPN** (https://dopplervpn.org) — Кастомный VPN на VLESS-Reality с гео-распределёнными нодами без логов. Нативные клиенты для iOS и Android.`,
      `- **Physics.explained** (https://physics.it.com/) — Open-source интерактивная платформа изучения физики с точными решателями ОДУ и словарём концепций.`,
      `- **Creator AI** (https://www.creatorai.art/en) — Платформа нейросетевого синтеза контента. Многоязычные редакторские пайплайны на Anthropic и OpenAI.`,
      `- **Go Delivery / ISR Shipping** (https://www.isrshipping.com) — Логистическая платформа с GPS-трекингом водителей в реальном времени, оптимизацией маршрутов и управлением жизненным циклом заказа.`,
    ],
    homeNarrative:
      "Simnetiq — небольшая лондонская студия из трёх владельцев-практиков. Мы доставляем ПО от и до: нативные мобильные и десктоп-приложения, веб-платформы, AI-фичи и пайплайны, кампании платного трафика, привязанные к настоящей атрибуции, и заказную VPN-инфраструктуру. Каждый контракт описан, оценён в GBP и подписан как SOW до начала кода.",
    aboutHeading: "О компании",
    companyRegistrationHeading: "Регистрация компании",
    companyRegistrationLines: [
      "- **Юридическое название:** Simnetiq Ltd",
      "- **Номер компании:** 16861177",
      "- **Юрисдикция:** Зарегистрирована в Англии и Уэльсе",
      "- **Статус НДС:** Не зарегистрирован по НДС (ниже порога)",
      "- **Юридический адрес:** Simnetiq Ltd, 2 Frederick Street, Kings Cross, London WC1X 0ND, United Kingdom",
      "- **Год основания:** 2025",
      "- **Операции:** Лондон, Великобритания (51.5074°N · 0.1278°W)",
    ],
    teamHeading: "Команда (три владельца-практика)",
    teamLines: [
      "01 — Директор / Инжиниринг — Roman Pochtman — Mobile, web, AI, инфраструктура",
      "02 — Директор / Инжиниринг — Dmitry Polskoy — Backend, автоматизация, growth-обвязка",
      "03 — Директор / Юр. и операционная часть — David Zitomirsky — Контракты, комплаенс, финансы",
    ],
    operatingPrinciplesHeading: "Операционные принципы",
    operatingPrinciples: [
      "- Каждый контракт оценивается в GBP по подписанному SOW. Без ретейнеров без чёткого результата.",
      "- Production-first: мы пишем код, который выживает в продакшене, а не demoware.",
      "- Доставка владельцами-практиками: те, кто принимает бриф, и пишут и доставляют код.",
      "- Наблюдаемость и CI/CD с первого дня каждого проекта.",
      "- Нативное там, где это важно; кросс-платформа — где не важно.",
    ],
    servicesPageHeading: "Услуги",
    projectsPageHeading: "Проекты",
    dopplerHeading: "Doppler VPN",
    dopplerStack:
      "Стек: Swift (iOS), Kotlin (Android), Go (сервер), control plane Marzban, протокол VLESS-Reality.",
    dopplerStatus:
      "Статус: Продакшен. Нативные приложения на iOS, Android, macOS и Windows. Оплата картой и криптовалютой. Без регистрации, без логов.",
    physicsHeading: "Physics.explained",
    physicsStack:
      "Стек: Next.js, WebGL, MathJax, кастомные покрытые тестами решатели ОДУ, AI-репетитор (Anthropic Claude) на /ask.",
    physicsStatus:
      "Статус: Open-source. Живая энциклопедия, охватывающая классическую механику, электромагнетизм, термодинамику, теорию относительности, квантовую и современную физику.",
    creatorHeading: "Creator AI",
    creatorStatus:
      "Статус: Продакшен. Многоязычная LLM-платформа контента на Anthropic и OpenAI. Нативные клиенты iOS и Android, выделенный бэкенд Supabase.",
    creatorStack: "Стек: Swift, Kotlin, Python, Supabase.",
    goDeliveryHeading: "Go Delivery / ISR Shipping",
    goDeliveryStatus:
      "Статус: Продакшен. Израильская логистическая платформа с GPS-трекингом водителей в реальном времени, оптимизацией маршрутов и управлением жизненным циклом заказа.",
    goDeliveryStack: "Стек: Next.js, React, Node.js, PostgreSQL.",
    greenFlaggedHeading: "Green Flagged",
    greenFlaggedStatus:
      "Статус: В разработке. Маркетинговый сайт запущен на greenflagged.com; API сканирования ещё не подключён. Пред-релиз, первая проверка бесплатно.",
    greenFlaggedStack:
      "Стек: Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4, примитивы Radix UI, GSAP, pnpm.",
    contactBookingHeading: "Контакты и запись",
    contactLines: (url) => [
      `- **Запись на ознакомительный звонок:** виджет Cal.com на ${url}`,
      `- **Юридический адрес:** Simnetiq Ltd, 2 Frederick Street, Kings Cross, London WC1X 0ND, United Kingdom`,
      `- **Companies House:** 16861177 (Англия и Уэльс)`,
      `- **Поддерживаемые языки:** английский (en-GB), иврит (he-IL), русский (ru-RU)`,
    ],
    machineRefsHeading: "Машинно-читаемые ссылки",
    machineRefs: () => [
      `- Индекс для AI-агентов: ${SITE_URL}/llms.txt`,
      `- Полный контент (этот файл): ${SITE_URL}/llms-full.txt`,
      `- XML-карта сайта: ${SITE_URL}/sitemap.xml`,
      `- robots.txt: ${SITE_URL}/robots.txt`,
    ],
    subServicesLabel: "Под-услуги",
    techStackLabel: "Технологический стек",
    pricingLabel: "Тарифные планы",
    metaLabel: "Мета",
    badgeLabel: "Бейдж",
    taglineLabel: "Слоган",
    urlLabel: "URL",
    titleLabel: "Заголовок",
  },
};

function renderService(s: Service, locale: Locale, p: Phrasebook): string {
  const fullTitle = getServiceFullTitle(s);
  const url = `${SITE_URL}/${locale}/services/${s.slug}`;

  const subServices = s.services
    .map((sv) => `- **${sv.code} · ${sv.title}** — ${sv.text}`)
    .join("\n");

  const techStack = s.techStack
    .map((g) => `- **${g.label}**: ${g.items.join(", ")}`)
    .join("\n");

  const pricing = s.pricing
    .map((tier) => {
      const sub = tier.sub ? ` (${tier.sub})` : "";
      const bullets = tier.bullets.map((b) => `  - ${b}`).join("\n");
      return `### ${tier.name} — ${tier.price}${sub}\n${tier.blurb}\n${bullets}`;
    })
    .join("\n\n");

  const meta = s.meta.map((m) => `- **${m.label}**: ${m.value}`).join("\n");

  return `## ${fullTitle} (${s.code})
${p.urlLabel}: ${url}
${p.badgeLabel}: ${s.badge}
${p.taglineLabel}: ${s.tagline}

${s.summary}

${s.positioning}

### ${p.subServicesLabel}
${subServices}

### ${p.techStackLabel}
${techStack}

### ${p.pricingLabel}
${pricing}

### ${p.metaLabel}
${meta}
`;
}

export function buildLlmsTxt(locale: Locale): string {
  const p = PHRASEBOOK[locale];
  const localeUrl = (path: string) => `${SITE_URL}/${locale}${path}`;
  const services = getServices(locale);

  const serviceLinks = services
    .map((s) => {
      const title = getServiceFullTitle(s);
      return `- [${title}](${localeUrl(`/services/${s.slug}`)}): ${s.tagline}`;
    })
    .join("\n");

  return `# Simnetiq

> ${p.intro}

${p.postIntro}

## ${p.servicesHeading}

${serviceLinks}

## ${p.projectsHeading}

${p.projectLines(localeUrl).join("\n")}

## ${p.companyHeading}

- [${p.about}](${localeUrl("/about")})
- [${p.servicesOverview}](${localeUrl("/services")})
- [${p.projectsIndex}](${localeUrl("/projects")})

## ${p.contactHeading}

- ${p.registeredOffice}
- ${p.companiesHouse}
- ${p.bookingLine}: ${localeUrl("")} — Cal.com

## ${p.optionalHeading}

- [${p.legalNotice}](${localeUrl("/legal")})
- [${p.privacyPolicy}](${localeUrl("/privacy-policy")})
${p.alternateLocaleLines.join("\n")}
- [llms-full.txt](${SITE_URL}/${locale}/llms-full.txt): ${p.llmsFullLine}
- [${p.sitemapLine}](${SITE_URL}/sitemap.xml)
`;
}

// ─── Per-page Markdown builders ───────────────────────────────────────────
// These return self-contained MD documents for each MD-supported route.
// Used by app/[locale]/*/markdown/route.ts handlers and indirectly by
// proxy.ts during Accept: text/markdown content negotiation.

function buildHeader(p: Phrasebook, title: string, url: string): string {
  return `# ${title}

> ${p.fullCanonical}: ${url}
> ${p.fullLastGenerated}: ${new Date().toISOString().slice(0, 10)}
`;
}

export function buildHomeMarkdown(locale: Locale): string {
  const p = PHRASEBOOK[locale];
  const localeUrl = (path: string) => `${SITE_URL}/${locale}${path}`;
  const home = ROUTE_COPY.home[locale];

  return `${buildHeader(p, home.title, localeUrl(""))}
${home.description}

${p.homeNarrative}

## ${p.liveDeploymentsHeading}

${p.liveDeployments().join("\n")}

## ${p.contactBookingHeading}

${p.contactLines(localeUrl("")).join("\n")}

## ${p.machineRefsHeading}

${p.machineRefs(localeUrl("")).join("\n")}
`;
}

export function buildAboutMarkdown(locale: Locale): string {
  const p = PHRASEBOOK[locale];
  const localeUrl = (path: string) => `${SITE_URL}/${locale}${path}`;
  const about = ROUTE_COPY.about[locale];

  return `${buildHeader(p, about.title, localeUrl("/about"))}
${about.description}

## ${p.companyRegistrationHeading}

${p.companyRegistrationLines.join("\n")}

## ${p.teamHeading}

${p.teamLines.join("\n")}

## ${p.operatingPrinciplesHeading}

${p.operatingPrinciples.join("\n")}
`;
}

export function buildServicesIndexMarkdown(locale: Locale): string {
  const p = PHRASEBOOK[locale];
  const localeUrl = (path: string) => `${SITE_URL}/${locale}${path}`;
  const services = getServices(locale);
  const servicesCopy = ROUTE_COPY.services[locale];

  const serviceLinks = services
    .map((s) => {
      const title = getServiceFullTitle(s);
      return `- [${title}](${localeUrl(`/services/${s.slug}`)}) — ${s.tagline}`;
    })
    .join("\n");

  return `${buildHeader(p, servicesCopy.title, localeUrl("/services"))}
${servicesCopy.description}

## ${p.servicesHeading}

${serviceLinks}
`;
}

export function buildServiceMarkdown(
  locale: Locale,
  slug: string
): string | null {
  const p = PHRASEBOOK[locale];
  const services = getServices(locale);
  const service = services.find((s) => s.slug === slug);
  if (!service) return null;
  const localeUrl = (path: string) => `${SITE_URL}/${locale}${path}`;
  const title = getServiceFullTitle(service);

  return `${buildHeader(p, title, localeUrl(`/services/${slug}`))}
${renderService(service, locale, p)}`;
}

export function buildProjectsIndexMarkdown(locale: Locale): string {
  const p = PHRASEBOOK[locale];
  const localeUrl = (path: string) => `${SITE_URL}/${locale}${path}`;
  const projects = ROUTE_COPY.projects[locale];

  return `${buildHeader(p, projects.title, localeUrl("/projects"))}
${projects.description}

## ${p.projectsHeading}

${p.projectLines(localeUrl).join("\n")}
`;
}

export function buildProjectMarkdown(
  locale: Locale,
  slug: string
): string | null {
  const p = PHRASEBOOK[locale];
  const localeUrl = (path: string) => `${SITE_URL}/${locale}${path}`;

  if (slug === "doppler-vpn") {
    const c = ROUTE_COPY.caseStudyDoppler[locale];
    return `${buildHeader(p, c.title, localeUrl("/projects/doppler-vpn"))}
Live: https://dopplervpn.org

${c.description}

${p.dopplerStack}
${p.dopplerStatus}
`;
  }
  if (slug === "physics-explained") {
    const c = ROUTE_COPY.caseStudyPhysics[locale];
    return `${buildHeader(p, c.title, localeUrl("/projects/physics-explained"))}
Live: https://physics.it.com

${c.description}

${p.physicsStack}
${p.physicsStatus}
`;
  }
  if (slug === "green-flagged") {
    const c = ROUTE_COPY.caseStudyGreenFlagged[locale];
    return `${buildHeader(p, c.title, localeUrl("/projects/green-flagged"))}
Live: https://greenflagged.vercel.app

${c.description}

${p.greenFlaggedStack}
${p.greenFlaggedStatus}
`;
  }
  return null;
}

export function buildLlmsFullTxt(locale: Locale): string {
  const p = PHRASEBOOK[locale];
  const localeUrl = (path: string) => `${SITE_URL}/${locale}${path}`;
  const services = getServices(locale);

  const home = ROUTE_COPY.home[locale];
  const about = ROUTE_COPY.about[locale];
  const projects = ROUTE_COPY.projects[locale];
  const servicesCopy = ROUTE_COPY.services[locale];
  const doppler = ROUTE_COPY.caseStudyDoppler[locale];
  const physics = ROUTE_COPY.caseStudyPhysics[locale];
  const greenFlagged = ROUTE_COPY.caseStudyGreenFlagged[locale];

  const servicesSection = services
    .map((s) => renderService(s, locale, p))
    .join("\n---\n\n");

  return `# ${p.fullTitle}

> ${p.fullIntro}
> ${p.fullCanonical}: ${localeUrl("")}
> ${p.fullLastGenerated}: ${new Date().toISOString().slice(0, 10)}
> ${p.fullSeeAlso}: ${SITE_URL}/${locale}/llms.txt · ${SITE_URL}/sitemap.xml

---

# ${p.homeHeading}

${p.urlLabel}: ${localeUrl("")}
${p.titleLabel}: ${home.title}

${home.description}

${p.homeNarrative}

## ${p.liveDeploymentsHeading}

${p.liveDeployments().join("\n")}

---

# ${p.aboutHeading}

${p.urlLabel}: ${localeUrl("/about")}
${p.titleLabel}: ${about.title}

${about.description}

## ${p.companyRegistrationHeading}

${p.companyRegistrationLines.join("\n")}

## ${p.teamHeading}

${p.teamLines.join("\n")}

## ${p.operatingPrinciplesHeading}

${p.operatingPrinciples.join("\n")}

---

# ${p.servicesPageHeading}

${p.urlLabel}: ${localeUrl("/services")}
${p.titleLabel}: ${servicesCopy.title}

${servicesCopy.description}

${servicesSection}

---

# ${p.projectsPageHeading}

${p.urlLabel}: ${localeUrl("/projects")}
${p.titleLabel}: ${projects.title}

${projects.description}

## ${p.dopplerHeading}

${p.urlLabel}: ${localeUrl("/projects/doppler-vpn")}
Live: https://dopplervpn.org
${p.titleLabel}: ${doppler.title}

${doppler.description}

${p.dopplerStack}
${p.dopplerStatus}

## ${p.physicsHeading}

${p.urlLabel}: ${localeUrl("/projects/physics-explained")}
Live: https://physics.it.com
${p.titleLabel}: ${physics.title}

${physics.description}

${p.physicsStack}
${p.physicsStatus}

## ${p.greenFlaggedHeading}

${p.urlLabel}: ${localeUrl("/projects/green-flagged")}
Live: https://greenflagged.vercel.app
${p.titleLabel}: ${greenFlagged.title}

${greenFlagged.description}

${p.greenFlaggedStack}
${p.greenFlaggedStatus}

## ${p.creatorHeading}

${p.urlLabel}: https://www.creatorai.art/en
${p.creatorStatus}
${p.creatorStack}

## ${p.goDeliveryHeading}

${p.urlLabel}: https://www.isrshipping.com
${p.goDeliveryStatus}
${p.goDeliveryStack}

---

# ${p.contactBookingHeading}

${p.contactLines(localeUrl("")).join("\n")}

---

# ${p.machineRefsHeading}

${p.machineRefs(localeUrl("")).join("\n")}
`;
}
