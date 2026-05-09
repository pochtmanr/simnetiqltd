import type { Locale } from "@/lib/i18n";

export type PriceTier = {
  name: string;
  /** Primary headline price, e.g. "FROM £12K" */
  price: string;
  /** Optional sub-price line, e.g. "+ £1.5K / month" */
  sub?: string;
  blurb: string;
  bullets: string[];
  highlighted?: boolean;
};

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
  /** Second (dim) fragment of the headline, e.g. "Marketing" in "Growth & Marketing". */
  titleSecondary: string;
  tagline: string;
  summary: string;
  positioning: string;
  services: { code: string; title: string; text: string }[];
  techStack: TechGroup[];
  pricing: PriceTier[];
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
    badge: "NATIVE · CROSS-PLATFORM",
    title: "Mobile &",
    titleSecondary: "Desktop",
    tagline: "Native clients that ship.",
    summary:
      "Production-grade applications for iOS, Android, macOS, Windows, and Linux. SwiftUI, Jetpack Compose, WinUI 3, .NET, and modern cross-platform runtimes — always chosen for the right reason, never for the easy one.",
    positioning:
      "From single-platform MVPs to multi-OS product suites with shared backends. We engineer for longevity: native performance, sensible architecture, and store-ready compliance from day one.",
    services: [
      { code: "S-01", title: "iOS / iPadOS Applications", text: "Native SwiftUI + UIKit. HIG-compliant, RevenueCat / StoreKit integration, TestFlight delivery, App Store submission management end-to-end." },
      { code: "S-02", title: "Android Applications", text: "Jetpack Compose, Material 3, Google Play policy compliance. Coroutines, Hilt, Room, ExoPlayer — whichever primitives the product actually needs." },
      { code: "S-03", title: "Desktop — macOS", text: "Native SwiftUI or AppKit for macOS. Menu bar utilities, full document-based apps, Mac App Store or notarised DMG distribution." },
      { code: "S-04", title: "Desktop — Windows", text: "WinUI 3, WPF, and .NET 8+ for modern Windows experiences. MSIX packaging, Microsoft Store distribution, or signed standalone installers." },
      { code: "S-05", title: "Desktop — Linux & Cross-Platform", text: "Tauri, Electron, Qt, and Flutter Desktop for single-codebase delivery across macOS, Windows, and Linux when the product warrants it." },
      { code: "S-06", title: "Store Submission & Release Ops", text: "App Store, Google Play, Mac App Store, Microsoft Store. Metadata, screenshots, review responses, phased rollouts, crash triage." },
    ],
    techStack: [
      { label: "iOS / Apple", items: ["Swift", "SwiftUI", "UIKit", "Combine", "Core Data", "StoreKit 2", "WidgetKit", "Xcode Cloud"] },
      { label: "Android / Google", items: ["Kotlin", "Jetpack Compose", "Material 3", "Coroutines", "Hilt", "Room", "WorkManager", "Play Billing"] },
      { label: "macOS", items: ["SwiftUI", "AppKit", "Combine", "Swift Charts", "Mac Catalyst"] },
      { label: "Windows", items: ["WinUI 3", "WPF", ".NET 8", "C#", "MSIX", "MAUI"] },
      { label: "Cross-Platform", items: ["Tauri", "Electron", "Flutter", "Qt 6", "React Native"] },
      { label: "Distribution", items: ["App Store Connect", "Google Play Console", "Mac App Store", "Microsoft Store", "Fastlane", "TestFlight"] },
    ],
    pricing: [
      { name: "Mobile", price: "FROM £1K", blurb: "iOS + Android from a single engagement.", bullets: ["Native iOS (SwiftUI) + Android (Compose)", "Shared product spec and design system", "Auth + payments + analytics wiring", "Store submission on both platforms"] },
      { name: "Mobile + Desktop", price: "FROM £3K", blurb: "Mobile plus desktop clients on macOS and Windows.", highlighted: true, bullets: ["iOS + Android native clients", "macOS (SwiftUI) + Windows (WinUI 3)", "Shared backend and design language", "Store submission across every platform"] },
      { name: "Full Ecosystem", price: "CUSTOM", blurb: "Apps, website, and bots shipped as one integrated product.", bullets: ["Mobile + desktop native clients", "Marketing site + product platform", "Telegram / Slack / Discord bots", "Backend, auth, billing, automation"] },
    ],
    meta: [
      { label: "Platforms", value: "iOS · Android · macOS · Windows · Linux" },
      { label: "Primary stack", value: "Swift · Kotlin · C# · Tauri" },
      { label: "Typical engagement", value: "6–16 weeks" },
    ],
  },
  {
    slug: "growth-marketing",
    code: "C-02",
    badge: "ADS · ATTRIBUTION · GROWTH",
    title: "Growth &",
    titleSecondary: "Marketing",
    tagline: "Paid acquisition wired to real attribution.",
    summary:
      "Meta, TikTok, and Google ad campaigns tuned against in-app events — not vanity metrics. AppsFlyer, Adjust, and Branch integrations built into iOS and Android clients, with weekly reporting and creative iteration cycles.",
    positioning:
      "Lean paid-acquisition engagements for apps and platforms. Every campaign launches with attribution wired, creative variants tested, and a spend report you can actually read — no black-box agency retainers.",
    services: [
      { code: "S-01", title: "Meta Ads (Facebook / Instagram)", text: "Campaign architecture, creative production, audience design, Pixel + Conversions API wiring, and weekly optimisation cycles." },
      { code: "S-02", title: "TikTok Ads", text: "TikTok Ads Manager, Spark Ads, creator partnerships, and Events SDK integration. Creative-first accounts, not spray-and-pray." },
      { code: "S-03", title: "AppsFlyer & MMP Integration", text: "AppsFlyer, Adjust, Branch SDK wiring into iOS and Android. Deep linking, event mapping, deduplication, fraud protection." },
      { code: "S-04", title: "Creative Production", text: "Video, static, and UGC ad creative iterations. Naming conventions, creative library management, structured A/B testing." },
      { code: "S-05", title: "Analytics & Reporting", text: "Weekly spend reports, LTV modelling, payback tracking. Dashboards in Looker, Metabase, or the native MMP console." },
      { code: "S-06", title: "Google Ads & App Campaigns", text: "Google UAC, search, and YouTube. Tag Manager, GA4, server-side conversions, and cross-channel deduplication." },
    ],
    techStack: [
      { label: "Ad Platforms", items: ["Meta Ads", "TikTok Ads", "Google Ads", "Apple Search Ads", "Reddit Ads"] },
      { label: "Attribution (MMPs)", items: ["AppsFlyer", "Adjust", "Branch", "Singular", "Kochava"] },
      { label: "Analytics", items: ["GA4", "Mixpanel", "Amplitude", "PostHog", "Looker Studio"] },
      { label: "Server-Side", items: ["Meta CAPI", "TikTok Events API", "Google Ads API", "Server GTM", "Stape"] },
      { label: "Creative", items: ["After Effects", "Figma", "CapCut", "Runway", "DaVinci Resolve"] },
      { label: "Tooling", items: ["Google Tag Manager", "Segment", "Iterable", "Customer.io"] },
    ],
    pricing: [
      { name: "Starter", price: "FROM £500", blurb: "Single-platform setup + first-month launch.", bullets: ["One ad channel (Meta or TikTok)", "Campaign, pixel, and event setup", "3 creative variants", "First-month monitoring"] },
      { name: "Scale", price: "FROM £1.5K", blurb: "Multi-channel launch with attribution wiring.", highlighted: true, bullets: ["Meta + TikTok (or + Google)", "AppsFlyer / Adjust SDK integration", "Creative production + A/B structure", "Weekly reporting dashboard", "First month of spend management"] },
      { name: "Retainer", price: "CUSTOM", blurb: "Ongoing growth operations, monthly cadence.", bullets: ["Dedicated growth operator", "Multi-channel portfolio management", "Creative iteration cycles", "LTV & payback modelling"] },
    ],
    meta: [
      { label: "Channels", value: "Meta · TikTok · Google" },
      { label: "Attribution", value: "AppsFlyer · Adjust · Branch" },
      { label: "Cadence", value: "1-week setup, monthly cycles" },
    ],
  },
  {
    slug: "ai-automation",
    code: "C-03",
    badge: "AI · PIPELINES · AGENTS",
    title: "AI &",
    titleSecondary: "Automation",
    tagline: "Production AI, wired to real pipelines.",
    summary:
      "Any model — Anthropic, OpenAI, open-weight, or fine-tuned. Any pipeline — n8n, Make.com, custom Node or Python on a dedicated VPS. Any data source — Postgres, S3, Notion, Stripe, Telegram, your own SaaS. We connect them into automations that survive production: scheduled, observable, retry-safe.",
    positioning:
      "Most AI work stops at a chatbot demo. We build the operational layer around it — the triggers, the data pipes, the retries, the observability — so the model becomes a system, not a feature flag.",
    services: [
      { code: "S-01", title: "AI Feature Engineering", text: "Prompt architecture, caching, streaming, structured outputs, tool-use. Built against evaluations, not opinions." },
      { code: "S-02", title: "Retrieval & RAG", text: "Embedding stores (pgvector, Pinecone, Weaviate), hybrid search, re-ranking, chunking strategies tuned per corpus." },
      { code: "S-03", title: "Agentic Workflows", text: "Multi-step agents with verifiable side effects. Tool catalogs, guardrails, cost ceilings, replay-safe execution." },
      { code: "S-04", title: "n8n & Make Pipelines", text: "Self-hosted n8n on your VPS or ours. Webhooks, schedules, retries, dead-letter queues, full audit trail." },
      { code: "S-05", title: "Custom Pipelines on VPS", text: "When n8n isn't enough — TypeScript or Python services on a dedicated VPS, queued via BullMQ or Redis Streams." },
      { code: "S-06", title: "Data & Vendor Integrations", text: "Postgres, Supabase, Stripe, HubSpot, Telegram, Slack, Notion, S3, Sheets, custom REST or GraphQL — wired in cleanly." },
    ],
    techStack: [
      { label: "AI Providers", items: ["Anthropic Claude", "OpenAI", "Google Gemini", "Mistral", "Together AI", "Replicate"] },
      { label: "Open-Weight & Local", items: ["Llama 3", "Qwen", "DeepSeek", "Ollama", "vLLM", "LM Studio"] },
      { label: "Vector & Retrieval", items: ["pgvector", "Pinecone", "Weaviate", "Qdrant", "Chroma", "Voyage AI"] },
      { label: "Pipelines", items: ["n8n", "Make.com", "Temporal", "BullMQ", "Trigger.dev", "Inngest"] },
      { label: "Runtimes", items: ["Node.js", "Python", "Bun", "Deno", "Docker", "Caddy / nginx"] },
      { label: "Infra", items: ["Hetzner VPS", "Railway", "Fly.io", "Supabase", "Cloudflare Workers", "Vercel"] },
    ],
    pricing: [
      { name: "Pilot", price: "FROM £1.5K", blurb: "One AI feature, end-to-end, in two weeks.", bullets: ["Single workflow scoped against a real use case", "Anthropic or OpenAI integration with caching", "Basic eval harness", "Deployed to your stack or ours"] },
      { name: "Production", price: "FROM £4K", blurb: "AI feature plus the pipeline that feeds it.", highlighted: true, bullets: ["LLM feature + retrieval / RAG layer", "n8n or custom pipeline on a dedicated VPS", "Vendor integrations (Stripe, Postgres, Telegram, etc.)", "Observability, retries, cost ceilings", "Eval harness + first month of monitoring"] },
      { name: "Platform", price: "CUSTOM", blurb: "Full AI + automation platform built on your data.", bullets: ["Multi-feature AI surface", "Self-hosted models or hybrid", "Custom agentic workflows with guardrails", "Full pipeline + data integration suite", "Ongoing operational ownership"] },
    ],
    meta: [
      { label: "Models", value: "Anthropic · OpenAI · Open-weight" },
      { label: "Pipelines", value: "n8n · Make · Custom on VPS" },
      { label: "Typical engagement", value: "2–10 weeks" },
    ],
  },
  {
    slug: "web-platforms",
    code: "C-04",
    badge: "WEB · SAAS · BILLING",
    title: "Web &",
    titleSecondary: "Platforms",
    tagline: "Next.js, Supabase, Stripe — production web.",
    summary:
      "Next.js 16, Supabase, Stripe, and edge-native billing. Marketing sites that convert, product platforms that scale, and the plumbing — auth, payments, webhooks, email — wired together cleanly.",
    positioning:
      "From a precision landing page to a full multi-tenant SaaS. Every platform ships with observability, CI/CD, and a clear operating story from day one.",
    services: [
      { code: "S-01", title: "Landing & Marketing Sites", text: "Next.js + Tailwind. SEO-grade performance, CMS on demand, crisp motion, analytics and experimentation wired in." },
      { code: "S-02", title: "SaaS Platforms", text: "Supabase + Next.js app router. Auth, RLS, row-level subscriptions, file storage, background jobs, admin consoles." },
      { code: "S-03", title: "Billing & Subscriptions", text: "Stripe Billing, Apple / Google IAP, RevenueCat. Tax handling, dunning, webhooks, customer portals, invoice flows." },
      { code: "S-04", title: "Authentication & Identity", text: "Sign in with Apple, Google, OAuth, magic link, passkeys. Organization / team models, invite flows, role hierarchies." },
      { code: "S-05", title: "Internal Tools & Dashboards", text: "Admin panels, ops dashboards, automation consoles. Built fast without sacrificing architecture." },
      { code: "S-06", title: "Integrations & Automation", text: "n8n workflows, Telegram bots, Slack apps, webhook relays, ETL pipelines. Connecting SaaS into your operations." },
    ],
    techStack: [
      { label: "Frontend", items: ["Next.js 16", "React 19", "TypeScript", "Tailwind v4", "shadcn/ui", "HeroUI", "Framer Motion"] },
      { label: "Backend / Data", items: ["Supabase", "PostgreSQL", "Drizzle", "Prisma", "Redis", "Cloudflare D1"] },
      { label: "Payments", items: ["Stripe Billing", "Stripe Connect", "RevenueCat", "Apple IAP", "Google Play Billing"] },
      { label: "Auth", items: ["Supabase Auth", "Clerk", "Auth.js", "Passkeys / WebAuthn", "Sign in with Apple"] },
      { label: "Hosting", items: ["Vercel", "Cloudflare Pages", "Hostinger VPS", "Supabase Edge Functions"] },
      { label: "Automation", items: ["n8n", "Inngest", "Trigger.dev", "Telegram Bot API", "Resend / SMTP"] },
    ],
    pricing: [
      { name: "Landing", price: "FROM £800", blurb: "Precision landing or marketing site.", bullets: ["Up to 6 pages", "Custom design system", "Analytics + SEO + sitemap", "One round of content revisions"] },
      { name: "Platform", price: "FROM £1.5K", blurb: "Full SaaS or product web app.", highlighted: true, bullets: ["Auth, billing, webhooks, email", "Admin / ops dashboard", "Supabase + Stripe wiring", "CI/CD, monitoring, staging", "30 days post-launch support"] },
      { name: "Enterprise", price: "CUSTOM", blurb: "Multi-tenant, compliance-heavy, dedicated team.", bullets: ["Multi-region architecture", "SSO, audit logs, fine-grained RBAC", "SOC 2 / GDPR alignment", "Signed SLA"] },
    ],
    meta: [
      { label: "Stack", value: "Next.js · Supabase · Stripe" },
      { label: "Typical TTM", value: "5–12 weeks" },
      { label: "Reference", value: "Simnetiq · Go Delivery" },
    ],
  },
];

const servicesHe: Service[] = [
  {
    slug: "mobile-desktop",
    code: "C-01",
    badge: "מקורי · רב-פלטפורמי",
    title: "מובייל",
    titleSecondary: "ושולחני",
    tagline: "אפליקציות מקוריות שיוצאות לאוויר.",
    summary:
      "אפליקציות ברמת ייצור ל-iOS, Android, macOS, Windows ו-Linux. SwiftUI, Jetpack Compose, WinUI 3, .NET וזמני ריצה רב-פלטפורמיים מודרניים — תמיד נבחרים מהסיבה הנכונה, לא הקלה.",
    positioning:
      "מ-MVP חד-פלטפורמי ועד חבילות מוצר רב-מערכתיות עם בקאנד משותף. אנו מהנדסים לאריכות חיים: ביצועים מקוריים, ארכיטקטורה הגיונית וציות מוכן לחנויות מהיום הראשון.",
    services: [
      { code: "S-01", title: "אפליקציות iOS / iPadOS", text: "SwiftUI + UIKit מקוריים. תאימות HIG, אינטגרציית RevenueCat / StoreKit, אספקה ב-TestFlight וניהול הגשה ל-App Store מקצה לקצה." },
      { code: "S-02", title: "אפליקציות Android", text: "Jetpack Compose, Material 3, ציות למדיניות Google Play. Coroutines, Hilt, Room, ExoPlayer — הפרימיטיבים שהמוצר באמת זקוק להם." },
      { code: "S-03", title: "שולחני — macOS", text: "SwiftUI או AppKit מקוריים ל-macOS. כלים לשורת תפריטים, אפליקציות מבוססות מסמכים, הפצה ב-Mac App Store או DMG חתום." },
      { code: "S-04", title: "שולחני — Windows", text: "WinUI 3, WPF ו-.NET 8+ לחוויות Windows מודרניות. אריזת MSIX, הפצה ב-Microsoft Store או מתקיני יחיד חתומים." },
      { code: "S-05", title: "שולחני — Linux ורב-פלטפורמי", text: "Tauri, Electron, Qt ו-Flutter Desktop למשלוח קוד יחיד על macOS, Windows ו-Linux כשהמוצר מצדיק זאת." },
      { code: "S-06", title: "הגשה לחנויות ותפעול גרסאות", text: "App Store, Google Play, Mac App Store, Microsoft Store. מטא-נתונים, צילומי מסך, מענה לסקירות, השקות מדורגות וטיפול בקריסות." },
    ],
    techStack: [
      { label: "iOS / Apple", items: ["Swift", "SwiftUI", "UIKit", "Combine", "Core Data", "StoreKit 2", "WidgetKit", "Xcode Cloud"] },
      { label: "Android / Google", items: ["Kotlin", "Jetpack Compose", "Material 3", "Coroutines", "Hilt", "Room", "WorkManager", "Play Billing"] },
      { label: "macOS", items: ["SwiftUI", "AppKit", "Combine", "Swift Charts", "Mac Catalyst"] },
      { label: "Windows", items: ["WinUI 3", "WPF", ".NET 8", "C#", "MSIX", "MAUI"] },
      { label: "רב-פלטפורמי", items: ["Tauri", "Electron", "Flutter", "Qt 6", "React Native"] },
      { label: "הפצה", items: ["App Store Connect", "Google Play Console", "Mac App Store", "Microsoft Store", "Fastlane", "TestFlight"] },
    ],
    pricing: [
      { name: "מובייל", price: "החל מ-£1K", blurb: "iOS + Android בהתקשרות אחת.", bullets: ["iOS מקורי (SwiftUI) + Android (Compose)", "מפרט מוצר ומערכת עיצוב משותפים", "חיבור אימות + תשלומים + אנליטיקה", "הגשה לשתי החנויות"] },
      { name: "מובייל + שולחני", price: "החל מ-£3K", blurb: "מובייל בתוספת לקוחות שולחניים על macOS ו-Windows.", highlighted: true, bullets: ["לקוחות iOS + Android מקוריים", "macOS (SwiftUI) + Windows (WinUI 3)", "בקאנד ושפת עיצוב משותפים", "הגשה בכל הפלטפורמות"] },
      { name: "אקוסיסטם מלא", price: "מותאם", blurb: "אפליקציות, אתר ובוטים מסופקים כמוצר משולב אחד.", bullets: ["לקוחות מקוריים מובייל + שולחני", "אתר שיווק + פלטפורמת מוצר", "בוטים ל-Telegram / Slack / Discord", "בקאנד, אימות, חיוב, אוטומציה"] },
    ],
    meta: [
      { label: "פלטפורמות", value: "iOS · Android · macOS · Windows · Linux" },
      { label: "מחסנית עיקרית", value: "Swift · Kotlin · C# · Tauri" },
      { label: "התקשרות אופיינית", value: "6–16 שבועות" },
    ],
  },
  {
    slug: "growth-marketing",
    code: "C-02",
    badge: "פרסום · ייחוס · צמיחה",
    title: "צמיחה",
    titleSecondary: "ושיווק",
    tagline: "רכישה ממומנת המחוברת לייחוס אמיתי.",
    summary:
      "קמפיינים ב-Meta, TikTok וגוגל המכוונים לאירועים בתוך האפליקציה — לא למדדי הבל. אינטגרציות AppsFlyer, Adjust ו-Branch הבנויות בלקוחות iOS ו-Android, עם דוחות שבועיים ומחזורי איטרציה יצירתיים.",
    positioning:
      "התקשרויות רכישה ממומנת רזות לאפליקציות ופלטפורמות. כל קמפיין יוצא לאוויר עם ייחוס מחובר, גרסאות יצירה שנבדקות ודוח הוצאה שאתם באמת יכולים לקרוא — בלי ריטיינרים סוכנותיים אטומים.",
    services: [
      { code: "S-01", title: "Meta Ads (Facebook / Instagram)", text: "ארכיטקטורת קמפיין, הפקה יצירתית, עיצוב קהלים, חיבור Pixel + Conversions API ומחזורי אופטימיזציה שבועיים." },
      { code: "S-02", title: "TikTok Ads", text: "TikTok Ads Manager, Spark Ads, שיתופי פעולה עם יוצרים, ואינטגרציית Events SDK. חשבונות מבוססי יצירה, לא ירייה לכל הכיוונים." },
      { code: "S-03", title: "אינטגרציית AppsFlyer ו-MMP", text: "חיבור AppsFlyer, Adjust ו-Branch SDK ל-iOS ו-Android. קישור עומק, מיפוי אירועים, דה-דופליקציה והגנה מהונאות." },
      { code: "S-04", title: "הפקה יצירתית", text: "איטרציות יצירה לסרטונים, סטטיים ו-UGC. מוסכמות שמות, ניהול ספריית יצירה ובדיקות A/B מובנות." },
      { code: "S-05", title: "אנליטיקה ודיווח", text: "דוחות הוצאה שבועיים, מודל LTV, מעקב החזר. דשבורדים ב-Looker, Metabase או בקונסולת ה-MMP המקורית." },
      { code: "S-06", title: "Google Ads ו-App Campaigns", text: "Google UAC, חיפוש ו-YouTube. Tag Manager, GA4, המרות שרת-לשרת ודה-דופליקציה בין-ערוצית." },
    ],
    techStack: [
      { label: "פלטפורמות פרסום", items: ["Meta Ads", "TikTok Ads", "Google Ads", "Apple Search Ads", "Reddit Ads"] },
      { label: "ייחוס (MMPs)", items: ["AppsFlyer", "Adjust", "Branch", "Singular", "Kochava"] },
      { label: "אנליטיקה", items: ["GA4", "Mixpanel", "Amplitude", "PostHog", "Looker Studio"] },
      { label: "צד שרת", items: ["Meta CAPI", "TikTok Events API", "Google Ads API", "Server GTM", "Stape"] },
      { label: "יצירה", items: ["After Effects", "Figma", "CapCut", "Runway", "DaVinci Resolve"] },
      { label: "כלים", items: ["Google Tag Manager", "Segment", "Iterable", "Customer.io"] },
    ],
    pricing: [
      { name: "התחלה", price: "החל מ-£500", blurb: "הקמה לפלטפורמה אחת + השקה בחודש הראשון.", bullets: ["ערוץ פרסום אחד (Meta או TikTok)", "הקמת קמפיין, פיקסל ואירועים", "3 גרסאות יצירה", "ניטור חודש ראשון"] },
      { name: "סקייל", price: "החל מ-£1.5K", blurb: "השקה רב-ערוצית עם חיווט ייחוס.", highlighted: true, bullets: ["Meta + TikTok (או + Google)", "אינטגרציית AppsFlyer / Adjust SDK", "הפקה יצירתית + מבנה A/B", "דשבורד דיווח שבועי", "ניהול הוצאות בחודש הראשון"] },
      { name: "ריטיינר", price: "מותאם", blurb: "תפעול צמיחה מתמשך, מחזור חודשי.", bullets: ["מפעיל צמיחה ייעודי", "ניהול תיק רב-ערוצי", "מחזורי איטרציה יצירתיים", "מודל LTV והחזר"] },
    ],
    meta: [
      { label: "ערוצים", value: "Meta · TikTok · Google" },
      { label: "ייחוס", value: "AppsFlyer · Adjust · Branch" },
      { label: "מחזור", value: "הקמה שבוע, מחזורים חודשיים" },
    ],
  },
  {
    slug: "ai-automation",
    code: "C-03",
    badge: "AI · צינורות · סוכנים",
    title: "AI",
    titleSecondary: "ואוטומציה",
    tagline: "AI ברמת ייצור, מחובר לצינורות אמיתיים.",
    summary:
      "כל מודל — Anthropic, OpenAI, משקל פתוח או מותאם אישית. כל צינור — n8n, Make.com, שירותי Node או Python מותאמים על VPS ייעודי. כל מקור נתונים — Postgres, S3, Notion, Stripe, Telegram, ה-SaaS שלכם. אנו מחברים אותם לאוטומציות ששורדות בייצור: מתוזמנות, מדידות, בטוחות לניסיון חוזר.",
    positioning:
      "רוב עבודת ה-AI עוצרת בדמו של צ׳אטבוט. אנחנו בונים סביבו את שכבת התפעול — הטריגרים, צינורות הנתונים, הניסיונות החוזרים, התצפית — כדי שהמודל יהפוך למערכת, לא ל-feature flag.",
    services: [
      { code: "S-01", title: "הנדסת תכונות AI", text: "ארכיטקטורת prompts, caching, streaming, פלטים מובנים, שימוש בכלים. נבנה מול הערכות, לא דעות." },
      { code: "S-02", title: "אחזור ו-RAG", text: "מאגרי embeddings (pgvector, Pinecone, Weaviate), חיפוש היברידי, דירוג מחדש ואסטרטגיות chunking המכווננות לכל קורפוס." },
      { code: "S-03", title: "זרימות עבודה אגנטיות", text: "סוכנים רב-שלביים עם השפעות לוואי ניתנות לאימות. קטלוגי כלים, מעקות בטיחות, תקרות עלות, הרצה בטוחה לחזרה." },
      { code: "S-04", title: "צינורות n8n ו-Make", text: "n8n self-hosted על ה-VPS שלכם או שלנו. Webhooks, תזמונים, ניסיונות חוזרים, dead-letter queues, audit trail מלא." },
      { code: "S-05", title: "צינורות מותאמים על VPS", text: "כש-n8n לא מספיק — שירותי TypeScript או Python על VPS ייעודי, בתורים דרך BullMQ או Redis Streams." },
      { code: "S-06", title: "אינטגרציות נתונים וספקים", text: "Postgres, Supabase, Stripe, HubSpot, Telegram, Slack, Notion, S3, Sheets, REST או GraphQL מותאם — מחווטים נקי." },
    ],
    techStack: [
      { label: "ספקי AI", items: ["Anthropic Claude", "OpenAI", "Google Gemini", "Mistral", "Together AI", "Replicate"] },
      { label: "משקל פתוח ומקומי", items: ["Llama 3", "Qwen", "DeepSeek", "Ollama", "vLLM", "LM Studio"] },
      { label: "וקטור ואחזור", items: ["pgvector", "Pinecone", "Weaviate", "Qdrant", "Chroma", "Voyage AI"] },
      { label: "צינורות", items: ["n8n", "Make.com", "Temporal", "BullMQ", "Trigger.dev", "Inngest"] },
      { label: "סביבות ריצה", items: ["Node.js", "Python", "Bun", "Deno", "Docker", "Caddy / nginx"] },
      { label: "תשתית", items: ["Hetzner VPS", "Railway", "Fly.io", "Supabase", "Cloudflare Workers", "Vercel"] },
    ],
    pricing: [
      { name: "פיילוט", price: "החל מ-£1.5K", blurb: "תכונת AI אחת, מקצה לקצה, בשבועיים.", bullets: ["זרימת עבודה יחידה מוגדרת מול שימוש אמיתי", "אינטגרציית Anthropic או OpenAI עם caching", "רתימת הערכה בסיסית", "פרוס למחסנית שלכם או שלנו"] },
      { name: "ייצור", price: "החל מ-£4K", blurb: "תכונת AI בתוספת הצינור שמזין אותה.", highlighted: true, bullets: ["תכונת LLM + שכבת אחזור / RAG", "n8n או צינור מותאם על VPS ייעודי", "אינטגרציות ספקים (Stripe, Postgres, Telegram וכו׳)", "תצפית, ניסיונות חוזרים, תקרות עלות", "רתימת הערכה + חודש ראשון של ניטור"] },
      { name: "פלטפורמה", price: "מותאם", blurb: "פלטפורמת AI ואוטומציה מלאה הבנויה על הנתונים שלכם.", bullets: ["משטח AI רב-תכונתי", "מודלים בהוסטינג עצמי או היברידיים", "זרימות אגנטיות מותאמות עם מעקות בטיחות", "חבילת אינטגרציית צינורות ונתונים מלאה", "בעלות תפעולית מתמשכת"] },
    ],
    meta: [
      { label: "מודלים", value: "Anthropic · OpenAI · משקל פתוח" },
      { label: "צינורות", value: "n8n · Make · מותאם על VPS" },
      { label: "התקשרות אופיינית", value: "2–10 שבועות" },
    ],
  },
  {
    slug: "web-platforms",
    code: "C-04",
    badge: "ווב · SaaS · חיוב",
    title: "ווב",
    titleSecondary: "ופלטפורמות",
    tagline: "מערכות ווב מקצה לקצה.",
    summary:
      "Next.js 16, Supabase, Stripe וחיוב edge-native. אתרי שיווק שממירים, פלטפורמות מוצר שמתאקלמות, וכל האינסטלציה — אימות, תשלומים, webhooks, אימייל — מחווטת באופן נקי.",
    positioning:
      "מאתר נחיתה מדויק ועד SaaS רב-דייר מלא. כל פלטפורמה משוגרת עם תצפית, CI/CD וסיפור תפעולי ברור מהיום הראשון.",
    services: [
      { code: "S-01", title: "אתרי נחיתה ושיווק", text: "Next.js + Tailwind. ביצועים ברמת SEO, CMS לפי דרישה, מוט קולח, אנליטיקה וניסויים מחווטים." },
      { code: "S-02", title: "פלטפורמות SaaS", text: "Supabase + Next.js app router. אימות, RLS, הרשמות ברמת השורה, אחסון קבצים, משימות רקע, קונסולות אדמין." },
      { code: "S-03", title: "חיוב ומנויים", text: "Stripe Billing, IAP של Apple / Google, RevenueCat. טיפול במס, גביית חוב, webhooks, פורטל לקוחות וזרימות חשבוניות." },
      { code: "S-04", title: "אימות וזהות", text: "Sign in with Apple, Google, OAuth, magic link, passkeys. מודלי ארגון / צוות, זרימות הזמנה והיררכיות תפקידים." },
      { code: "S-05", title: "כלים פנימיים ודשבורדים", text: "פאנלי אדמין, דשבורדי תפעול, קונסולות אוטומציה. נבנים מהר בלי לוותר על ארכיטקטורה." },
      { code: "S-06", title: "אינטגרציות ואוטומציה", text: "זרימות עבודה ב-n8n, בוטים ל-Telegram, אפליקציות ל-Slack, ממסרי webhook וצינורות ETL. מחברים את ה-SaaS לתפעול שלכם." },
    ],
    techStack: [
      { label: "Frontend", items: ["Next.js 16", "React 19", "TypeScript", "Tailwind v4", "shadcn/ui", "HeroUI", "Framer Motion"] },
      { label: "Backend / נתונים", items: ["Supabase", "PostgreSQL", "Drizzle", "Prisma", "Redis", "Cloudflare D1"] },
      { label: "תשלומים", items: ["Stripe Billing", "Stripe Connect", "RevenueCat", "Apple IAP", "Google Play Billing"] },
      { label: "אימות", items: ["Supabase Auth", "Clerk", "Auth.js", "Passkeys / WebAuthn", "Sign in with Apple"] },
      { label: "אירוח", items: ["Vercel", "Cloudflare Pages", "Hostinger VPS", "Supabase Edge Functions"] },
      { label: "אוטומציה", items: ["n8n", "Inngest", "Trigger.dev", "Telegram Bot API", "Resend / SMTP"] },
    ],
    pricing: [
      { name: "נחיתה", price: "החל מ-£800", blurb: "אתר נחיתה או שיווק מדויק.", bullets: ["עד 6 עמודים", "מערכת עיצוב מותאמת", "אנליטיקה + SEO + sitemap", "סבב אחד של תיקוני תוכן"] },
      { name: "פלטפורמה", price: "החל מ-£1.5K", blurb: "אפליקציית ווב מוצר או SaaS מלאה.", highlighted: true, bullets: ["אימות, חיוב, webhooks, אימייל", "דשבורד אדמין / תפעול", "חיווט Supabase + Stripe", "CI/CD, ניטור, סטייג'ינג", "30 יום תמיכה לאחר השקה"] },
      { name: "ארגוני", price: "מותאם", blurb: "רב-דייר, ציות כבד, צוות ייעודי.", bullets: ["ארכיטקטורה רב-אזורית", "SSO, audit logs, RBAC עדין", "התאמה ל-SOC 2 / GDPR", "SLA חתום"] },
    ],
    meta: [
      { label: "מחסנית", value: "Next.js · Supabase · Stripe" },
      { label: "TTM אופייני", value: "5–12 שבועות" },
      { label: "ייחוס", value: "Simnetiq · Go Delivery" },
    ],
  },
];

const servicesRu: Service[] = [
  {
    slug: "mobile-desktop",
    code: "C-01",
    badge: "NATIVE · CROSS-PLATFORM",
    title: "Mobile &",
    titleSecondary: "Desktop",
    tagline: "Нативные клиенты, которые выходят в продакшен.",
    summary:
      "Production-приложения для iOS, Android, macOS, Windows и Linux. SwiftUI, Jetpack Compose, WinUI 3, .NET и современные кросс-платформенные рантаймы — выбираем по существу, а не по простоте.",
    positioning:
      "От моноплатформенных MVP до мультиОС-продуктов с общими бэкендами. Закладываем долгосрочное качество: нативная производительность, разумная архитектура и готовность к публикации в сторах с первого дня.",
    services: [
      { code: "S-01", title: "Приложения для iOS / iPadOS", text: "Нативные SwiftUI + UIKit. Соответствие HIG, интеграция RevenueCat / StoreKit, доставка через TestFlight, ведение релиза в App Store от заявки до публикации." },
      { code: "S-02", title: "Приложения для Android", text: "Jetpack Compose, Material 3, соответствие политикам Google Play. Coroutines, Hilt, Room, ExoPlayer — собираем именно те примитивы, которые нужны продукту." },
      { code: "S-03", title: "Десктоп — macOS", text: "Нативный SwiftUI или AppKit для macOS. Утилиты для menu bar, документ-ориентированные приложения, дистрибуция через Mac App Store или нотаризованный DMG." },
      { code: "S-04", title: "Десктоп — Windows", text: "WinUI 3, WPF и .NET 8+ для современного Windows-опыта. Упаковка MSIX, дистрибуция в Microsoft Store или подписанные standalone-инсталляторы." },
      { code: "S-05", title: "Десктоп — Linux и кросс-платформа", text: "Tauri, Electron, Qt и Flutter Desktop для единой кодовой базы под macOS, Windows и Linux, когда это оправдано." },
      { code: "S-06", title: "Сабмишн в сторы и release ops", text: "App Store, Google Play, Mac App Store, Microsoft Store. Метаданные, скриншоты, ответы ревьюверам, поэтапные раскатки, разбор крашей." },
    ],
    techStack: [
      { label: "iOS / Apple", items: ["Swift", "SwiftUI", "UIKit", "Combine", "Core Data", "StoreKit 2", "WidgetKit", "Xcode Cloud"] },
      { label: "Android / Google", items: ["Kotlin", "Jetpack Compose", "Material 3", "Coroutines", "Hilt", "Room", "WorkManager", "Play Billing"] },
      { label: "macOS", items: ["SwiftUI", "AppKit", "Combine", "Swift Charts", "Mac Catalyst"] },
      { label: "Windows", items: ["WinUI 3", "WPF", ".NET 8", "C#", "MSIX", "MAUI"] },
      { label: "Кросс-платформа", items: ["Tauri", "Electron", "Flutter", "Qt 6", "React Native"] },
      { label: "Дистрибуция", items: ["App Store Connect", "Google Play Console", "Mac App Store", "Microsoft Store", "Fastlane", "TestFlight"] },
    ],
    pricing: [
      { name: "Mobile", price: "ОТ £1K", blurb: "iOS + Android в рамках одного контракта.", bullets: ["Нативный iOS (SwiftUI) + Android (Compose)", "Общая продуктовая спека и дизайн-система", "Подключение auth + платежей + аналитики", "Сабмишн в обе сторы"] },
      { name: "Mobile + Desktop", price: "ОТ £3K", blurb: "Mobile плюс десктоп-клиенты на macOS и Windows.", highlighted: true, bullets: ["Нативные iOS + Android клиенты", "macOS (SwiftUI) + Windows (WinUI 3)", "Общий бэкенд и единый дизайн-язык", "Сабмишн на каждую из платформ"] },
      { name: "Полная экосистема", price: "ИНДИВИДУАЛЬНО", blurb: "Приложения, сайт и боты как единый продукт.", bullets: ["Mobile + десктоп нативные клиенты", "Маркетинговый сайт + продуктовая платформа", "Боты для Telegram / Slack / Discord", "Бэкенд, auth, биллинг, автоматизация"] },
    ],
    meta: [
      { label: "Платформы", value: "iOS · Android · macOS · Windows · Linux" },
      { label: "Основной стек", value: "Swift · Kotlin · C# · Tauri" },
      { label: "Типичный контракт", value: "6–16 недель" },
    ],
  },
  {
    slug: "growth-marketing",
    code: "C-02",
    badge: "ADS · ATTRIBUTION · GROWTH",
    title: "Growth &",
    titleSecondary: "Marketing",
    tagline: "Платный трафик, привязанный к настоящей атрибуции.",
    summary:
      "Кампании в Meta, TikTok и Google, оптимизированные под реальные in-app события — не по vanity-метрикам. Интеграции AppsFlyer, Adjust и Branch встроены в iOS- и Android-клиенты, еженедельная отчётность и итерации креативов.",
    positioning:
      "Лёгкие контракты на платный трафик для приложений и платформ. Каждая кампания запускается с настроенной атрибуцией, тестируемыми вариантами креативов и понятным отчётом по тратам — без чёрно-ящичных агентских ретейнеров.",
    services: [
      { code: "S-01", title: "Meta Ads (Facebook / Instagram)", text: "Архитектура кампаний, продакшен креативов, дизайн аудиторий, подключение Pixel + Conversions API, еженедельные циклы оптимизации." },
      { code: "S-02", title: "TikTok Ads", text: "TikTok Ads Manager, Spark Ads, партнёрства с креаторами, интеграция Events SDK. Креатив-first, а не spray-and-pray." },
      { code: "S-03", title: "AppsFlyer и MMP-интеграция", text: "Подключение AppsFlyer, Adjust, Branch SDK в iOS и Android. Deep linking, маппинг событий, дедупликация, fraud-protection." },
      { code: "S-04", title: "Продакшен креативов", text: "Видео, статика, UGC. Naming-конвенции, ведение креативной библиотеки, структурированный A/B." },
      { code: "S-05", title: "Аналитика и отчётность", text: "Еженедельные отчёты по тратам, LTV-моделирование, отслеживание payback. Дашборды в Looker, Metabase или нативной консоли MMP." },
      { code: "S-06", title: "Google Ads и App Campaigns", text: "Google UAC, поиск, YouTube. Tag Manager, GA4, server-side конверсии и кросс-канальная дедупликация." },
    ],
    techStack: [
      { label: "Рекламные платформы", items: ["Meta Ads", "TikTok Ads", "Google Ads", "Apple Search Ads", "Reddit Ads"] },
      { label: "Атрибуция (MMP)", items: ["AppsFlyer", "Adjust", "Branch", "Singular", "Kochava"] },
      { label: "Аналитика", items: ["GA4", "Mixpanel", "Amplitude", "PostHog", "Looker Studio"] },
      { label: "Server-side", items: ["Meta CAPI", "TikTok Events API", "Google Ads API", "Server GTM", "Stape"] },
      { label: "Креатив", items: ["After Effects", "Figma", "CapCut", "Runway", "DaVinci Resolve"] },
      { label: "Инструменты", items: ["Google Tag Manager", "Segment", "Iterable", "Customer.io"] },
    ],
    pricing: [
      { name: "Starter", price: "ОТ £500", blurb: "Настройка одной платформы + запуск первого месяца.", bullets: ["Один рекламный канал (Meta или TikTok)", "Настройка кампаний, pixel и событий", "3 варианта креативов", "Мониторинг первого месяца"] },
      { name: "Scale", price: "ОТ £1.5K", blurb: "Мультиканальный запуск с подключённой атрибуцией.", highlighted: true, bullets: ["Meta + TikTok (или + Google)", "Интеграция AppsFlyer / Adjust SDK", "Продакшен креативов + структура A/B", "Еженедельный отчётный дашборд", "Управление тратами в первый месяц"] },
      { name: "Ретейнер", price: "ИНДИВИДУАЛЬНО", blurb: "Постоянные операции по росту, ежемесячный ритм.", bullets: ["Выделенный growth-оператор", "Управление мультиканальным портфелем", "Циклы итераций креативов", "Моделирование LTV и payback"] },
    ],
    meta: [
      { label: "Каналы", value: "Meta · TikTok · Google" },
      { label: "Атрибуция", value: "AppsFlyer · Adjust · Branch" },
      { label: "Ритм", value: "Неделя на сетап, ежемесячные циклы" },
    ],
  },
  {
    slug: "ai-automation",
    code: "C-03",
    badge: "AI · PIPELINES · AGENTS",
    title: "AI &",
    titleSecondary: "Automation",
    tagline: "Production AI, подключённый к реальным пайплайнам.",
    summary:
      "Любая модель — Anthropic, OpenAI, open-weight или fine-tuned. Любой пайплайн — n8n, Make.com, кастомный Node или Python на выделенном VPS. Любой источник данных — Postgres, S3, Notion, Stripe, Telegram, ваш собственный SaaS. Связываем их в автоматизации, которые выживают в продакшене: расписание, наблюдаемость, безопасные ретраи.",
    positioning:
      "Большинство AI-проектов останавливаются на демке чат-бота. Мы строим вокруг неё операционный слой — триггеры, потоки данных, ретраи, наблюдаемость — чтобы модель стала системой, а не feature flag'ом.",
    services: [
      { code: "S-01", title: "Инженерия AI-фич", text: "Архитектура промптов, кэширование, стриминг, структурированные ответы, tool-use. Проверяется evals, а не мнениями." },
      { code: "S-02", title: "Retrieval и RAG", text: "Векторные хранилища (pgvector, Pinecone, Weaviate), гибридный поиск, реранкинг, стратегии чанкинга под конкретный корпус." },
      { code: "S-03", title: "Агентные сценарии", text: "Многошаговые агенты с проверяемыми сайд-эффектами. Каталоги инструментов, guardrails, ограничения по стоимости, безопасное воспроизведение исполнения." },
      { code: "S-04", title: "Пайплайны на n8n и Make", text: "Self-hosted n8n на вашем VPS или нашем. Webhook'и, расписания, ретраи, dead-letter очереди, полный аудит-трейл." },
      { code: "S-05", title: "Кастомные пайплайны на VPS", text: "Когда n8n уже мало — TypeScript- или Python-сервисы на выделенном VPS, очереди через BullMQ или Redis Streams." },
      { code: "S-06", title: "Интеграции данных и вендоров", text: "Postgres, Supabase, Stripe, HubSpot, Telegram, Slack, Notion, S3, Sheets, кастомный REST или GraphQL — подключаем чисто." },
    ],
    techStack: [
      { label: "AI-провайдеры", items: ["Anthropic Claude", "OpenAI", "Google Gemini", "Mistral", "Together AI", "Replicate"] },
      { label: "Open-weight и локальные", items: ["Llama 3", "Qwen", "DeepSeek", "Ollama", "vLLM", "LM Studio"] },
      { label: "Векторы и retrieval", items: ["pgvector", "Pinecone", "Weaviate", "Qdrant", "Chroma", "Voyage AI"] },
      { label: "Пайплайны", items: ["n8n", "Make.com", "Temporal", "BullMQ", "Trigger.dev", "Inngest"] },
      { label: "Рантаймы", items: ["Node.js", "Python", "Bun", "Deno", "Docker", "Caddy / nginx"] },
      { label: "Инфраструктура", items: ["Hetzner VPS", "Railway", "Fly.io", "Supabase", "Cloudflare Workers", "Vercel"] },
    ],
    pricing: [
      { name: "Pilot", price: "ОТ £1.5K", blurb: "Одна AI-фича от и до за две недели.", bullets: ["Один сценарий под реальный кейс", "Интеграция Anthropic или OpenAI с кэшированием", "Базовый eval-харнесс", "Развёртывание на вашем стеке или нашем"] },
      { name: "Production", price: "ОТ £4K", blurb: "AI-фича плюс пайплайн, который её питает.", highlighted: true, bullets: ["LLM-фича + слой retrieval / RAG", "n8n или кастомный пайплайн на выделенном VPS", "Интеграции вендоров (Stripe, Postgres, Telegram и т.д.)", "Наблюдаемость, ретраи, потолки по стоимости", "Eval-харнесс + первый месяц мониторинга"] },
      { name: "Платформа", price: "ИНДИВИДУАЛЬНО", blurb: "Полноценная AI- и автоматизационная платформа на ваших данных.", bullets: ["Несколько AI-поверхностей", "Self-hosted модели или гибрид", "Кастомные агентные сценарии с guardrails", "Полный набор пайплайнов и интеграций данных", "Постоянное операционное сопровождение"] },
    ],
    meta: [
      { label: "Модели", value: "Anthropic · OpenAI · Open-weight" },
      { label: "Пайплайны", value: "n8n · Make · Кастом на VPS" },
      { label: "Типичный контракт", value: "2–10 недель" },
    ],
  },
  {
    slug: "web-platforms",
    code: "C-04",
    badge: "WEB · SAAS · BILLING",
    title: "Web &",
    titleSecondary: "Platforms",
    tagline: "Next.js, Supabase, Stripe — production-веб.",
    summary:
      "Next.js 16, Supabase, Stripe и edge-нативный биллинг. Маркетинговые сайты, которые конвертят, продуктовые платформы, которые масштабируются, и связующая сантехника — auth, платежи, webhooks, email — собранные чисто.",
    positioning:
      "От прецизионного лендинга до полноценного multi-tenant SaaS. Каждая платформа выходит с наблюдаемостью, CI/CD и понятной операционной историей с первого дня.",
    services: [
      { code: "S-01", title: "Лендинги и маркетинговые сайты", text: "Next.js + Tailwind. SEO-grade перформанс, CMS по запросу, аккуратная анимация, подключённая аналитика и эксперименты." },
      { code: "S-02", title: "SaaS-платформы", text: "Supabase + Next.js app router. Auth, RLS, row-level подписки, файловое хранилище, фоновые задачи, админ-консоли." },
      { code: "S-03", title: "Биллинг и подписки", text: "Stripe Billing, Apple / Google IAP, RevenueCat. Налоги, dunning, webhooks, customer-портал, флоу инвойсов." },
      { code: "S-04", title: "Аутентификация", text: "Sign in with Apple, Google, OAuth, magic link, passkeys. Модели организаций / команд, флоу инвайтов, иерархии ролей." },
      { code: "S-05", title: "Внутренние инструменты и дашборды", text: "Админ-панели, ops-дашборды, консоли автоматизации. Быстро, без ущерба для архитектуры." },
      { code: "S-06", title: "Интеграции и автоматизация", text: "Workflow на n8n, Telegram-боты, Slack-приложения, webhook-релеи, ETL-пайплайны. Подключаем SaaS к вашим операциям." },
    ],
    techStack: [
      { label: "Frontend", items: ["Next.js 16", "React 19", "TypeScript", "Tailwind v4", "shadcn/ui", "HeroUI", "Framer Motion"] },
      { label: "Backend / Data", items: ["Supabase", "PostgreSQL", "Drizzle", "Prisma", "Redis", "Cloudflare D1"] },
      { label: "Платежи", items: ["Stripe Billing", "Stripe Connect", "RevenueCat", "Apple IAP", "Google Play Billing"] },
      { label: "Auth", items: ["Supabase Auth", "Clerk", "Auth.js", "Passkeys / WebAuthn", "Sign in with Apple"] },
      { label: "Хостинг", items: ["Vercel", "Cloudflare Pages", "Hostinger VPS", "Supabase Edge Functions"] },
      { label: "Автоматизация", items: ["n8n", "Inngest", "Trigger.dev", "Telegram Bot API", "Resend / SMTP"] },
    ],
    pricing: [
      { name: "Лендинг", price: "ОТ £800", blurb: "Прецизионный лендинг или маркетинговый сайт.", bullets: ["До 6 страниц", "Кастомная дизайн-система", "Аналитика + SEO + sitemap", "Один раунд правок контента"] },
      { name: "Платформа", price: "ОТ £1.5K", blurb: "Полноценный SaaS или продуктовое веб-приложение.", highlighted: true, bullets: ["Auth, биллинг, webhooks, email", "Админ-/ops-дашборд", "Подключение Supabase + Stripe", "CI/CD, мониторинг, staging", "30 дней постзапускной поддержки"] },
      { name: "Enterprise", price: "ИНДИВИДУАЛЬНО", blurb: "Multi-tenant, тяжёлый комплаенс, выделенная команда.", bullets: ["Мультирегиональная архитектура", "SSO, audit-логи, тонкий RBAC", "Соответствие SOC 2 / GDPR", "Подписанный SLA"] },
    ],
    meta: [
      { label: "Стек", value: "Next.js · Supabase · Stripe" },
      { label: "Типичный TTM", value: "5–12 недель" },
      { label: "Референс", value: "Simnetiq · Go Delivery" },
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
