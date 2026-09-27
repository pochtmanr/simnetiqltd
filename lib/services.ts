import type { Locale } from "@/lib/i18n";

export type TechGroup = {
  label: string;
  items: string[];
};

export type Service = {
  slug: string;
  code: string;
  badge: string;
  /** First (primary, full-text) part of the headline. */
  title: string;
  /** Second (dim) fragment of the headline, e.g. "Platforms" in "Web & Platforms". */
  titleSecondary: string;
  tagline: string;
  summary: string;
  positioning: string;
  services: { code: string; title: string; text: string }[];
  techStack: TechGroup[];
  meta: { label: string; value: string }[];
};

/** Combined human-readable title used in listings, breadcrumbs, schema, and metadata. */
export function getServiceFullTitle(s: Service): string {
  return `${s.title} ${s.titleSecondary}`.replace(/\s+/g, " ").trim();
}

const servicesEn: Service[] = [
  {
    slug: "mobile-desktop",
    code: "C-01",
    badge: "APPS · MOBILE · DESKTOP",
    title: "Mobile & desktop",
    titleSecondary: "app development",
    tagline: "Put your product in your customers’ hands.",
    summary: "iOS, Android and desktop app development for customer services, paid products and tools your team uses every day.",
    positioning: "Start with the devices your users already use. We design the app, connect accounts and payments, and prepare it for release so customers can use your service wherever they work.",
    services: [
      { code: "S-01", title: "iOS & iPad apps", text: "Let customers book, buy or manage their accounts on iPhone and iPad. We build native apps with SwiftUI and UIKit, including payments and notifications." },
      { code: "S-02", title: "Android apps", text: "Bring your service to Android phones and tablets. We build with Kotlin and Jetpack Compose and connect the app to your existing business systems." },
      { code: "S-03", title: "macOS apps", text: "Give Mac users a focused workspace for everyday tasks. From menu bar tools to full desktop apps, with file access and system features where they help." },
      { code: "S-04", title: "Windows apps", text: "Build tools for the computers your team works on. Windows apps can bring records, files and daily tasks together in one place." },
      { code: "S-05", title: "Cross-platform apps", text: "Reach more devices with a shared codebase when it suits the product. We weigh development effort, device features and maintenance before choosing the approach." },
      { code: "S-06", title: "App store release & updates", text: "Prepare your app for customers: store listings, screenshots, testing and submission. We also handle review feedback and plan how updates reach users." },
    ],
    techStack: [
      { label: "iOS & iPadOS", items: ["Swift", "SwiftUI", "UIKit", "Combine", "Core Data", "StoreKit 2", "WidgetKit", "Xcode Cloud"] },
      { label: "Android", items: ["Kotlin", "Jetpack Compose", "Material 3", "Coroutines", "Hilt", "Room", "WorkManager", "Play Billing"] },
      { label: "macOS", items: ["SwiftUI", "AppKit", "Combine", "Swift Charts", "Mac Catalyst"] },
      { label: "Windows", items: ["WinUI 3", "WPF", ".NET 8", "C#", "MSIX", "MAUI"] },
      { label: "Cross-platform development", items: ["Tauri", "Electron", "Flutter", "Qt 6", "React Native"] },
      { label: "App stores & releases", items: ["App Store Connect", "Google Play Console", "Mac App Store", "Microsoft Store", "Fastlane", "TestFlight"] },
    ],
    meta: [
      { label: "Platforms", value: "iOS · Android · macOS · Windows · Linux" },
      { label: "Built for", value: "Customer apps · Team tools · Paid products" },
      { label: "Delivery", value: "Design · Development · Store submission" },
    ],
  },
  {
    slug: "web-platforms",
    code: "C-02",
    badge: "WEBSITES · SAAS · ONLINE PAYMENTS",
    title: "Websites &",
    titleSecondary: "SaaS development",
    tagline: "Help customers find you and take the next step.",
    summary: "Custom websites, SaaS platforms and internal tools that help customers understand your offer, buy online and manage their accounts.",
    positioning: "Build around the next action your customer or team needs to take. We connect the website, accounts, payments and business tools so the experience works from the first visit to everyday use.",
    services: [
      { code: "S-01", title: "Business websites & landing pages", text: "Explain your offer clearly and make enquiries easy. We build responsive pages with accessible layouts, search-friendly structure and a clear path to contact." },
      { code: "S-02", title: "SaaS products & customer portals", text: "Give customers a place to sign in, use your service and manage their account. We build the product interface, data storage and tools to run it." },
      { code: "S-03", title: "Payments & subscriptions", text: "Let customers pay, change plans and find their invoices. We connect Stripe or app store billing and handle the events your business needs to keep accounts up to date." },
      { code: "S-04", title: "Accounts & team access", text: "Help the right people access the right information. Sign-in, invitations and roles support individual customers, teams and administrators." },
      { code: "S-05", title: "Internal tools & dashboards", text: "Bring the records and actions your team needs into one workspace. Manage orders, review activity and handle routine tasks without moving between spreadsheets." },
      { code: "S-06", title: "Business system integrations", text: "Connect your website with the tools you already use. Orders, enquiries and account updates can move between systems without repeated data entry." },
    ],
    techStack: [
      { label: "Web interfaces", items: ["Next.js 16", "React 19", "TypeScript", "Tailwind v4", "shadcn/ui", "HeroUI", "Framer Motion"] },
      { label: "Databases & storage", items: ["Supabase", "PostgreSQL", "Drizzle", "Prisma", "Redis", "Cloudflare D1"] },
      { label: "Payments", items: ["Stripe Billing", "Stripe Connect", "RevenueCat", "Apple IAP", "Google Play Billing"] },
      { label: "Sign-in & accounts", items: ["Supabase Auth", "Clerk", "Auth.js", "Passkeys / WebAuthn", "Sign in with Apple"] },
      { label: "Hosting", items: ["Vercel", "Cloudflare Pages", "Hostinger VPS", "Supabase Edge Functions"] },
      { label: "Workflow automation", items: ["n8n", "Inngest", "Trigger.dev", "Telegram Bot API", "Resend / SMTP"] },
    ],
    meta: [
      { label: "Built for", value: "Business websites · SaaS · Internal tools" },
      { label: "Core tools", value: "Next.js · Supabase · Stripe" },
      { label: "Connected services", value: "Accounts · Payments · Business systems" },
    ],
  },
  {
    slug: "ai-automation",
    code: "C-03",
    badge: "AI INTEGRATION · WORKFLOW AUTOMATION",
    title: "AI &",
    titleSecondary: "business automation",
    tagline: "Give your team less repetitive work.",
    summary: "AI integration and workflow automation that connect your business tools, organise information and reduce manual follow-up.",
    positioning: "Start with a task your team repeats: sorting requests, finding information or updating records. We build the workflow, test it with real examples and define where a person reviews the result.",
    services: [
      { code: "S-01", title: "AI features for your product", text: "Help users summarise documents, draft content or extract information. We connect AI models to your product and test the results against examples that matter to your business." },
      { code: "S-02", title: "Search across your business knowledge", text: "Make relevant information easier to find in documents and internal resources. Retrieval connects AI answers to your material, with source references users can check." },
      { code: "S-03", title: "AI-assisted workflows", text: "Connect tasks such as classifying a request, preparing a response and updating a record. Define approval steps before the workflow takes actions that need human review." },
      { code: "S-04", title: "n8n & Make automation", text: "Connect forms, email, CRM and other business tools. Scheduled workflows and automatic hand-offs help your team avoid copying the same information between systems." },
      { code: "S-05", title: "Custom workflow development", text: "Build workflows around processes that need custom logic or larger data volumes. We use Node.js or Python services with queues, retries and monitoring." },
      { code: "S-06", title: "Data & business tool integrations", text: "Keep information moving between your databases, CRM, payments and team tools. Connect services such as HubSpot, Stripe, Slack and Notion through their APIs." },
    ],
    techStack: [
      { label: "AI models & services", items: ["Anthropic Claude", "OpenAI", "Google Gemini", "Mistral", "Together AI", "Replicate"] },
      { label: "Models on your own servers", items: ["Llama 3", "Qwen", "DeepSeek", "Ollama", "vLLM", "LM Studio"] },
      { label: "Search & knowledge retrieval", items: ["pgvector", "Pinecone", "Weaviate", "Qdrant", "Chroma", "Voyage AI"] },
      { label: "Workflow automation", items: ["n8n", "Make.com", "Temporal", "BullMQ", "Trigger.dev", "Inngest"] },
      { label: "Server development tools", items: ["Node.js", "Python", "Bun", "Deno", "Docker", "Caddy / nginx"] },
      { label: "Hosting & infrastructure", items: ["Hetzner VPS", "Railway", "Fly.io", "Supabase", "Cloudflare Workers", "Vercel"] },
    ],
    meta: [
      { label: "Built for", value: "Repeat tasks · Business knowledge · Data entry" },
      { label: "Tools", value: "OpenAI · Anthropic · n8n · Make" },
      { label: "Workflow design", value: "Triggers · Actions · Human review" },
    ],
  },
];

const servicesHe: Service[] = [
  {
    slug: "mobile-desktop",
    code: "C-01",
    badge: "אפליקציות · מובייל · מחשבים",
    title: "פיתוח אפליקציות",
    titleSecondary: "למובייל ולמחשב",
    tagline: "המוצר שלכם, במכשירים של הלקוחות שלכם.",
    summary: "פיתוח אפליקציות ל-iOS, ל-Android ולמחשבים: שירותים ללקוחות, מוצרים בתשלום וכלים שהצוות משתמש בהם בכל יום.",
    positioning: "מתחילים במכשירים שהמשתמשים שלכם כבר עובדים איתם. מתכננים את האפליקציה, מחברים חשבונות ותשלומים ומכינים אותה להשקה, כדי שיהיה נוח להשתמש בשירות שלכם לאורך היום.",
    services: [
      { code: "S-01", title: "אפליקציות ל-iOS ול-iPad", text: "אפשרו ללקוחות להזמין, לשלם ולנהל את החשבון מה-iPhone או ה-iPad. אנחנו מפתחים ב-SwiftUI וב-UIKit ומשלבים תשלומים והתראות." },
      { code: "S-02", title: "אפליקציות ל-Android", text: "הביאו את השירות שלכם לטלפונים ולטאבלטים של Android. אנחנו מפתחים ב-Kotlin וב-Jetpack Compose ומחברים את האפליקציה למערכות העסק." },
      { code: "S-03", title: "אפליקציות ל-macOS", text: "סביבת עבודה נוחה למשתמשי Mac: מכלים בשורת התפריטים ועד אפליקציות מלאות, עם גישה לקבצים וליכולות המערכת בהתאם לצורך." },
      { code: "S-04", title: "אפליקציות ל-Windows", text: "כלים למחשבים שהצוות שלכם עובד עליהם. ריכוז רשומות, קבצים ומשימות יומיומיות באפליקציה אחת." },
      { code: "S-05", title: "אפליקציות למספר פלטפורמות", text: "משתמשים בבסיס קוד משותף כשזה מתאים למוצר. בוחנים את יכולות המכשירים, היקף הפיתוח והתחזוקה לפני שבוחרים את הגישה." },
      { code: "S-06", title: "פרסום בחנויות ועדכונים", text: "מכינים את האפליקציה לקהל: תיאורים, צילומי מסך, בדיקות והגשה לחנויות. מטפלים בהערות הבדיקה ומתכננים את הפצת העדכונים." },
    ],
    techStack: [
      { label: "iOS ו-iPadOS", items: ["Swift", "SwiftUI", "UIKit", "Combine", "Core Data", "StoreKit 2", "WidgetKit", "Xcode Cloud"] },
      { label: "Android", items: ["Kotlin", "Jetpack Compose", "Material 3", "Coroutines", "Hilt", "Room", "WorkManager", "Play Billing"] },
      { label: "macOS", items: ["SwiftUI", "AppKit", "Combine", "Swift Charts", "Mac Catalyst"] },
      { label: "Windows", items: ["WinUI 3", "WPF", ".NET 8", "C#", "MSIX", "MAUI"] },
      { label: "פיתוח למספר פלטפורמות", items: ["Tauri", "Electron", "Flutter", "Qt 6", "React Native"] },
      { label: "חנויות והפצת עדכונים", items: ["App Store Connect", "Google Play Console", "Mac App Store", "Microsoft Store", "Fastlane", "TestFlight"] },
    ],
    meta: [
      { label: "פלטפורמות", value: "iOS · Android · macOS · Windows · Linux" },
      { label: "מתאים ל", value: "שירותי לקוחות · כלי עבודה · מוצרים בתשלום" },
      { label: "העבודה כוללת", value: "עיצוב · פיתוח · הגשה לחנויות" },
    ],
  },
  {
    slug: "web-platforms",
    code: "C-02",
    badge: "אתרים · SAAS · תשלומים מקוונים",
    title: "פיתוח אתרים",
    titleSecondary: "ופלטפורמות SaaS",
    tagline: "עוזרים ללקוחות למצוא אתכם ולעשות את הצעד הבא.",
    summary: "אתרים, פלטפורמות SaaS וכלים פנימיים שמאפשרים ללקוחות להבין מה אתם מציעים, לשלם באינטרנט ולנהל את החשבון שלהם.",
    positioning: "מתכננים סביב הפעולה הבאה שהלקוח או הצוות צריכים לבצע. מחברים את האתר, החשבונות, התשלומים ומערכות העסק לחוויה נוחה מהביקור הראשון ועד לשימוש היומיומי.",
    services: [
      { code: "S-01", title: "אתרים לעסקים ודפי נחיתה", text: "הציגו את ההצעה שלכם בצורה ברורה והקלו על לקוחות לפנות אליכם. אנחנו בונים דפים מותאמים למסכים שונים, עם ממשק נגיש ומבנה שמתאים למנועי חיפוש." },
      { code: "S-02", title: "מוצרי SaaS ואזור אישי", text: "תנו ללקוחות מקום להיכנס לשירות ולנהל את החשבון. אנחנו בונים את הממשק, אחסון הנתונים והכלים הדרושים לניהול המוצר." },
      { code: "S-03", title: "תשלומים ומנויים", text: "אפשרו ללקוחות לשלם, לשנות מסלול ולמצוא חשבוניות. אנחנו מחברים את Stripe או תשלומים בחנויות האפליקציות ומעדכנים את מצב החשבון בהתאם." },
      { code: "S-04", title: "חשבונות והרשאות לצוות", text: "עוזרים לכל משתמש להגיע למידע הנכון. כניסה לחשבון, הזמנות והרשאות למשתמשים פרטיים, לצוותים ולמנהלים." },
      { code: "S-05", title: "כלים פנימיים ולוחות בקרה", text: "מרכזים את המידע והפעולות שהצוות צריך במקום אחד. ניהול הזמנות, בדיקת פעילות ומשימות שוטפות בלי לעבור שוב ושוב בין גיליונות." },
      { code: "S-06", title: "חיבור למערכות העסק", text: "מחברים את האתר לכלים שאתם כבר משתמשים בהם. הזמנות, פניות ועדכוני חשבון עוברים בין המערכות בלי להזין את אותו מידע מחדש." },
    ],
    techStack: [
      { label: "ממשקי ווב", items: ["Next.js 16", "React 19", "TypeScript", "Tailwind v4", "shadcn/ui", "HeroUI", "Framer Motion"] },
      { label: "מסדי נתונים ואחסון", items: ["Supabase", "PostgreSQL", "Drizzle", "Prisma", "Redis", "Cloudflare D1"] },
      { label: "תשלומים", items: ["Stripe Billing", "Stripe Connect", "RevenueCat", "Apple IAP", "Google Play Billing"] },
      { label: "כניסה וחשבונות", items: ["Supabase Auth", "Clerk", "Auth.js", "Passkeys / WebAuthn", "Sign in with Apple"] },
      { label: "אחסון אתרים", items: ["Vercel", "Cloudflare Pages", "Hostinger VPS", "Supabase Edge Functions"] },
      { label: "אוטומציה של תהליכים", items: ["n8n", "Inngest", "Trigger.dev", "Telegram Bot API", "Resend / SMTP"] },
    ],
    meta: [
      { label: "מתאים ל", value: "אתרים לעסקים · SaaS · כלים פנימיים" },
      { label: "כלים מרכזיים", value: "Next.js · Supabase · Stripe" },
      { label: "מה מחברים", value: "חשבונות · תשלומים · מערכות עסקיות" },
    ],
  },
  {
    slug: "ai-automation",
    code: "C-03",
    badge: "שילוב AI · אוטומציה של תהליכים",
    title: "שילוב AI",
    titleSecondary: "ואוטומציה עסקית",
    tagline: "פחות משימות חוזרות לצוות שלכם.",
    summary: "שילוב בינה מלאכותית ואוטומציה שמחברים את מערכות העסק, מסדרים מידע ומצמצמים טיפול ידני במשימות שוטפות.",
    positioning: "מתחילים במשימה שהצוות חוזר עליה: מיון פניות, חיפוש מידע או עדכון רשומות. בונים את התהליך, בודקים אותו על דוגמאות אמיתיות ומגדירים היכן נדרשת בדיקה אנושית.",
    services: [
      { code: "S-01", title: "יכולות AI במוצר שלכם", text: "עוזרים למשתמשים לסכם מסמכים, להכין טיוטות ולחלץ מידע. מחברים מודלי AI למוצר ובודקים את התוצאות על דוגמאות שחשובות לעסק." },
      { code: "S-02", title: "חיפוש בידע של העסק", text: "מקלים על מציאת מידע במסמכים ובמקורות פנימיים. מחברים את תשובות ה-AI לחומרים שלכם ומציגים הפניות למקורות שאפשר לבדוק." },
      { code: "S-03", title: "תהליכי עבודה בסיוע AI", text: "מחברים בין שלבים כמו מיון פנייה, הכנת תשובה ועדכון רשומה. מגדירים שלבי אישור לפני פעולות שדורשות בדיקה אנושית." },
      { code: "S-04", title: "אוטומציה ב-n8n וב-Make", text: "מחברים טפסים, דוא״ל, CRM וכלים נוספים. תהליכים מתוזמנים והעברת נתונים אוטומטית חוסכים הזנה חוזרת של מידע בין מערכות." },
      { code: "S-05", title: "פיתוח תהליכים מותאמים", text: "בונים תהליכים שדורשים לוגיקה ייחודית או טיפול בכמויות נתונים גדולות. משתמשים ב-Node.js או ב-Python, עם תורי משימות, ניסיונות חוזרים וניטור." },
      { code: "S-06", title: "חיבור נתונים ושירותים", text: "מחברים בין מסדי הנתונים, ה-CRM, התשלומים וכלי הצוות. שילוב שירותים כמו HubSpot, Stripe, Slack ו-Notion באמצעות API." },
    ],
    techStack: [
      { label: "מודלים ושירותי AI", items: ["Anthropic Claude", "OpenAI", "Google Gemini", "Mistral", "Together AI", "Replicate"] },
      { label: "מודלים בשרתים שלכם", items: ["Llama 3", "Qwen", "DeepSeek", "Ollama", "vLLM", "LM Studio"] },
      { label: "חיפוש ואחזור מידע", items: ["pgvector", "Pinecone", "Weaviate", "Qdrant", "Chroma", "Voyage AI"] },
      { label: "אוטומציה של תהליכים", items: ["n8n", "Make.com", "Temporal", "BullMQ", "Trigger.dev", "Inngest"] },
      { label: "כלים לפיתוח בשרת", items: ["Node.js", "Python", "Bun", "Deno", "Docker", "Caddy / nginx"] },
      { label: "אחסון ותשתיות", items: ["Hetzner VPS", "Railway", "Fly.io", "Supabase", "Cloudflare Workers", "Vercel"] },
    ],
    meta: [
      { label: "מתאים ל", value: "משימות חוזרות · ידע עסקי · הזנת נתונים" },
      { label: "כלים", value: "OpenAI · Anthropic · n8n · Make" },
      { label: "תכנון התהליך", value: "תנאי הפעלה · פעולות · בדיקה אנושית" },
    ],
  },
];

const servicesRu: Service[] = [
  {
    slug: "mobile-desktop",
    code: "C-01",
    badge: "ПРИЛОЖЕНИЯ · СМАРТФОНЫ · КОМПЬЮТЕРЫ",
    title: "Разработка приложений",
    titleSecondary: "для мобильных и ПК",
    tagline: "Ваш продукт на устройствах ваших клиентов.",
    summary: "Разрабатываем приложения для iOS, Android и компьютеров: клиентские сервисы, платные продукты и инструменты для ежедневной работы команды.",
    positioning: "Начинаем с устройств, которыми пользуется ваша аудитория. Проектируем приложение, подключаем аккаунты и оплату, готовим выпуск, чтобы вашим сервисом было удобно пользоваться каждый день.",
    services: [
      { code: "S-01", title: "Приложения для iOS и iPad", text: "Дайте клиентам возможность заказывать, оплачивать и управлять аккаунтом с iPhone или iPad. Разрабатываем на SwiftUI и UIKit, подключаем платежи и уведомления." },
      { code: "S-02", title: "Приложения для Android", text: "Перенесите свой сервис на телефоны и планшеты Android. Разрабатываем на Kotlin и Jetpack Compose и связываем приложение с системами вашего бизнеса." },
      { code: "S-03", title: "Приложения для macOS", text: "Создаём удобное рабочее пространство для пользователей Mac: от утилит в строке меню до полноценных приложений с доступом к файлам и системным функциям." },
      { code: "S-04", title: "Приложения для Windows", text: "Создаём инструменты для компьютеров, на которых работает ваша команда. Объединяем записи, файлы и ежедневные задачи в одном приложении." },
      { code: "S-05", title: "Кроссплатформенные приложения", text: "Используем общую кодовую базу для нескольких платформ, когда это подходит продукту. Учитываем функции устройств, объём разработки и дальнейшую поддержку." },
      { code: "S-06", title: "Публикация и обновления", text: "Готовим приложение к выпуску: описание, скриншоты, тестирование и отправку в магазины. Работаем с замечаниями модераторов и планируем выпуск обновлений." },
    ],
    techStack: [
      { label: "iOS и iPadOS", items: ["Swift", "SwiftUI", "UIKit", "Combine", "Core Data", "StoreKit 2", "WidgetKit", "Xcode Cloud"] },
      { label: "Android", items: ["Kotlin", "Jetpack Compose", "Material 3", "Coroutines", "Hilt", "Room", "WorkManager", "Play Billing"] },
      { label: "macOS", items: ["SwiftUI", "AppKit", "Combine", "Swift Charts", "Mac Catalyst"] },
      { label: "Windows", items: ["WinUI 3", "WPF", ".NET 8", "C#", "MSIX", "MAUI"] },
      { label: "Разработка для нескольких платформ", items: ["Tauri", "Electron", "Flutter", "Qt 6", "React Native"] },
      { label: "Магазины и выпуск приложений", items: ["App Store Connect", "Google Play Console", "Mac App Store", "Microsoft Store", "Fastlane", "TestFlight"] },
    ],
    meta: [
      { label: "Платформы", value: "iOS · Android · macOS · Windows · Linux" },
      { label: "Для чего", value: "Клиентские сервисы · Рабочие инструменты" },
      { label: "Работы", value: "Дизайн · Разработка · Публикация" },
    ],
  },
  {
    slug: "web-platforms",
    code: "C-02",
    badge: "САЙТЫ · SAAS · ОНЛАЙН-ОПЛАТА",
    title: "Разработка сайтов",
    titleSecondary: "и SaaS-платформ",
    tagline: "Помогите клиентам найти вас и сделать следующий шаг.",
    summary: "Создаём сайты, SaaS-платформы и внутренние инструменты, чтобы клиенты могли разобраться в вашем предложении, оплатить услуги и управлять аккаунтом.",
    positioning: "Проектируем сервис вокруг конкретных действий клиента или сотрудника. Соединяем сайт, личный кабинет, оплату и рабочие системы, чтобы ими было удобно пользоваться с первого визита.",
    services: [
      { code: "S-01", title: "Сайты для бизнеса и лендинги", text: "Понятно расскажите о своём предложении и упростите отправку заявки. Создаём адаптивные страницы с доступным интерфейсом и структурой, понятной поисковым системам." },
      { code: "S-02", title: "SaaS-продукты и личные кабинеты", text: "Дайте клиентам доступ к вашему сервису и управлению аккаунтом. Разрабатываем интерфейс, хранение данных и инструменты для работы с продуктом." },
      { code: "S-03", title: "Платежи и подписки", text: "Клиенты смогут оплачивать услуги, менять тарифы и находить счета. Подключаем Stripe или оплату через магазины приложений и синхронизируем статусы платежей." },
      { code: "S-04", title: "Аккаунты и доступ команды", text: "Настраиваем вход, приглашения и роли, чтобы каждый видел нужную информацию. Поддерживаем отдельные аккаунты, команды и администраторов." },
      { code: "S-05", title: "Внутренние инструменты и панели", text: "Собираем нужные сотрудникам данные и действия в одном месте. Заказы, история операций и повседневные задачи без постоянного переключения между таблицами." },
      { code: "S-06", title: "Интеграции бизнес-систем", text: "Связываем сайт с вашими рабочими инструментами. Заявки, заказы и изменения в аккаунтах передаются между системами без повторного ввода." },
    ],
    techStack: [
      { label: "Веб-интерфейсы", items: ["Next.js 16", "React 19", "TypeScript", "Tailwind v4", "shadcn/ui", "HeroUI", "Framer Motion"] },
      { label: "Базы данных и хранение", items: ["Supabase", "PostgreSQL", "Drizzle", "Prisma", "Redis", "Cloudflare D1"] },
      { label: "Платежи", items: ["Stripe Billing", "Stripe Connect", "RevenueCat", "Apple IAP", "Google Play Billing"] },
      { label: "Вход и аккаунты", items: ["Supabase Auth", "Clerk", "Auth.js", "Passkeys / WebAuthn", "Sign in with Apple"] },
      { label: "Хостинг", items: ["Vercel", "Cloudflare Pages", "Hostinger VPS", "Supabase Edge Functions"] },
      { label: "Автоматизация процессов", items: ["n8n", "Inngest", "Trigger.dev", "Telegram Bot API", "Resend / SMTP"] },
    ],
    meta: [
      { label: "Для чего", value: "Сайты для бизнеса · SaaS · Внутренние инструменты" },
      { label: "Основные инструменты", value: "Next.js · Supabase · Stripe" },
      { label: "Подключаем", value: "Аккаунты · Оплату · Бизнес-системы" },
    ],
  },
  {
    slug: "ai-automation",
    code: "C-03",
    badge: "ИНТЕГРАЦИЯ ИИ · АВТОМАТИЗАЦИЯ ПРОЦЕССОВ",
    title: "Внедрение ИИ",
    titleSecondary: "и автоматизация",
    tagline: "Меньше повторяющихся задач для вашей команды.",
    summary: "Внедряем ИИ и автоматизируем процессы: связываем рабочие системы, упорядочиваем информацию и сокращаем ручную обработку данных.",
    positioning: "Начинаем с задачи, которую команда выполняет регулярно: обработка заявок, поиск информации или обновление записей. Собираем процесс, проверяем на реальных примерах и определяем этапы проверки человеком.",
    services: [
      { code: "S-01", title: "Функции ИИ для вашего продукта", text: "Помогаем пользователям составлять краткие обзоры документов, готовить тексты и извлекать данные. Подключаем модели ИИ и проверяем результаты на примерах из вашей работы." },
      { code: "S-02", title: "Поиск по знаниям компании", text: "Упрощаем поиск в документах и внутренних материалах. Ответы ИИ опираются на ваши данные и содержат ссылки на источники для проверки." },
      { code: "S-03", title: "Рабочие процессы с ИИ", text: "Связываем этапы работы: классификацию заявки, подготовку ответа и обновление записи. Для действий, требующих проверки, предусматриваем согласование человеком." },
      { code: "S-04", title: "Автоматизация в n8n и Make", text: "Соединяем формы, почту, CRM и другие инструменты. Запуск по расписанию и передача данных между системами избавляют команду от повторного ввода." },
      { code: "S-05", title: "Разработка автоматизации под задачу", text: "Создаём процессы со сложной логикой или большими объёмами данных. Используем Node.js или Python, очереди задач, повторные попытки и мониторинг." },
      { code: "S-06", title: "Интеграция данных и сервисов", text: "Связываем базы данных, CRM, платежи и инструменты команды. Подключаем HubSpot, Stripe, Slack, Notion и другие сервисы через API." },
    ],
    techStack: [
      { label: "Модели и сервисы ИИ", items: ["Anthropic Claude", "OpenAI", "Google Gemini", "Mistral", "Together AI", "Replicate"] },
      { label: "Модели на ваших серверах", items: ["Llama 3", "Qwen", "DeepSeek", "Ollama", "vLLM", "LM Studio"] },
      { label: "Поиск по данным и документам", items: ["pgvector", "Pinecone", "Weaviate", "Qdrant", "Chroma", "Voyage AI"] },
      { label: "Автоматизация процессов", items: ["n8n", "Make.com", "Temporal", "BullMQ", "Trigger.dev", "Inngest"] },
      { label: "Инструменты для серверов", items: ["Node.js", "Python", "Bun", "Deno", "Docker", "Caddy / nginx"] },
      { label: "Хостинг и инфраструктура", items: ["Hetzner VPS", "Railway", "Fly.io", "Supabase", "Cloudflare Workers", "Vercel"] },
    ],
    meta: [
      { label: "Для чего", value: "Рутинные задачи · Поиск информации · Ввод данных" },
      { label: "Инструменты", value: "OpenAI · Anthropic · n8n · Make" },
      { label: "Процесс", value: "Условия запуска · Действия · Проверка человеком" },
    ],
  },
];

const SERVICES_BY_LOCALE: Record<Locale, Service[]> = {
  en: servicesEn,
  he: servicesHe,
  ru: servicesRu,
};

/** Backward-compatible default export of the EN services array. */
export const services = servicesEn;

export function getServices(locale: Locale): Service[] {
  return SERVICES_BY_LOCALE[locale] ?? servicesEn;
}

export function getService(slug: string, locale: Locale = "en"): Service | undefined {
  return getServices(locale).find((s) => s.slug === slug);
}

export function getAllServiceSlugs(): string[] {
  return servicesEn.map((s) => s.slug);
}
