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
  title: string;
  tagline: string;
  summary: string;
  positioning: string;
  services: { code: string; title: string; text: string }[];
  techStack: TechGroup[];
  pricing: PriceTier[];
  meta: { label: string; value: string }[];
};

export const services: Service[] = [
  // --------------------------------------------------------------------------
  {
    slug: "mobile-desktop",
    code: "C-01",
    badge: "NATIVE · CROSS-PLATFORM",
    title: "Mobile & Desktop",
    tagline: "Native clients that ship.",
    summary:
      "Production-grade applications for iOS, Android, macOS, Windows, and Linux. SwiftUI, Jetpack Compose, WinUI 3, .NET, and modern cross-platform runtimes — always chosen for the right reason, never for the easy one.",
    positioning:
      "From single-platform MVPs to multi-OS product suites with shared backends. We engineer for longevity: native performance, sensible architecture, and store-ready compliance from day one.",
    services: [
      {
        code: "S-01",
        title: "iOS / iPadOS Applications",
        text: "Native SwiftUI + UIKit. HIG-compliant, RevenueCat / StoreKit integration, TestFlight delivery, App Store submission management end-to-end.",
      },
      {
        code: "S-02",
        title: "Android Applications",
        text: "Jetpack Compose, Material 3, Google Play policy compliance. Coroutines, Hilt, Room, ExoPlayer — whichever primitives the product actually needs.",
      },
      {
        code: "S-03",
        title: "Desktop — macOS",
        text: "Native SwiftUI or AppKit for macOS. Menu bar utilities, full document-based apps, Mac App Store or notarised DMG distribution.",
      },
      {
        code: "S-04",
        title: "Desktop — Windows",
        text: "WinUI 3, WPF, and .NET 8+ for modern Windows experiences. MSIX packaging, Microsoft Store distribution, or signed standalone installers.",
      },
      {
        code: "S-05",
        title: "Desktop — Linux & Cross-Platform",
        text: "Tauri, Electron, Qt, and Flutter Desktop for single-codebase delivery across macOS, Windows, and Linux when the product warrants it.",
      },
      {
        code: "S-06",
        title: "Store Submission & Release Ops",
        text: "App Store, Google Play, Mac App Store, Microsoft Store. Metadata, screenshots, review responses, phased rollouts, crash triage.",
      },
    ],
    techStack: [
      {
        label: "iOS / Apple",
        items: ["Swift", "SwiftUI", "UIKit", "Combine", "Core Data", "StoreKit 2", "WidgetKit", "Xcode Cloud"],
      },
      {
        label: "Android / Google",
        items: ["Kotlin", "Jetpack Compose", "Material 3", "Coroutines", "Hilt", "Room", "WorkManager", "Play Billing"],
      },
      {
        label: "macOS",
        items: ["SwiftUI", "AppKit", "Combine", "Swift Charts", "Mac Catalyst"],
      },
      {
        label: "Windows",
        items: ["WinUI 3", "WPF", ".NET 8", "C#", "MSIX", "MAUI"],
      },
      {
        label: "Cross-Platform",
        items: ["Tauri", "Electron", "Flutter", "Qt 6", "React Native"],
      },
      {
        label: "Distribution",
        items: ["App Store Connect", "Google Play Console", "Mac App Store", "Microsoft Store", "Fastlane", "TestFlight"],
      },
    ],
    pricing: [
      {
        name: "Mobile",
        price: "FROM £1K",
        blurb: "iOS + Android from a single engagement.",
        bullets: [
          "Native iOS (SwiftUI) + Android (Compose)",
          "Shared product spec and design system",
          "Auth + payments + analytics wiring",
          "Store submission on both platforms",
        ],
      },
      {
        name: "Mobile + Desktop",
        price: "FROM £3K",
        blurb: "Mobile plus desktop clients on macOS and Windows.",
        highlighted: true,
        bullets: [
          "iOS + Android native clients",
          "macOS (SwiftUI) + Windows (WinUI 3)",
          "Shared backend and design language",
          "Store submission across every platform",
        ],
      },
      {
        name: "Full Ecosystem",
        price: "CUSTOM",
        blurb: "Apps, website, and bots shipped as one integrated product.",
        bullets: [
          "Mobile + desktop native clients",
          "Marketing site + product platform",
          "Telegram / Slack / Discord bots",
          "Backend, auth, billing, automation",
        ],
      },
    ],
    meta: [
      { label: "Platforms", value: "iOS · Android · macOS · Windows · Linux" },
      { label: "Primary stack", value: "Swift · Kotlin · C# · Tauri" },
      { label: "Typical engagement", value: "6–16 weeks" },
    ],
  },

  // --------------------------------------------------------------------------
  {
    slug: "growth-marketing",
    code: "C-02",
    badge: "ADS · ATTRIBUTION · GROWTH",
    title: "Growth & Marketing",
    tagline: "Paid acquisition, wired to real attribution.",
    summary:
      "Meta, TikTok, and Google ad campaigns tuned against in-app events — not vanity metrics. AppsFlyer, Adjust, and Branch integrations built into iOS and Android clients, with weekly reporting and creative iteration cycles.",
    positioning:
      "Lean paid-acquisition engagements for apps and platforms. Every campaign launches with attribution wired, creative variants tested, and a spend report you can actually read — no black-box agency retainers.",
    services: [
      {
        code: "S-01",
        title: "Meta Ads (Facebook / Instagram)",
        text: "Campaign architecture, creative production, audience design, Pixel + Conversions API wiring, and weekly optimisation cycles.",
      },
      {
        code: "S-02",
        title: "TikTok Ads",
        text: "TikTok Ads Manager, Spark Ads, creator partnerships, and Events SDK integration. Creative-first accounts, not spray-and-pray.",
      },
      {
        code: "S-03",
        title: "AppsFlyer & MMP Integration",
        text: "AppsFlyer, Adjust, Branch SDK wiring into iOS and Android. Deep linking, event mapping, deduplication, fraud protection.",
      },
      {
        code: "S-04",
        title: "Creative Production",
        text: "Video, static, and UGC ad creative iterations. Naming conventions, creative library management, structured A/B testing.",
      },
      {
        code: "S-05",
        title: "Analytics & Reporting",
        text: "Weekly spend reports, LTV modelling, payback tracking. Dashboards in Looker, Metabase, or the native MMP console.",
      },
      {
        code: "S-06",
        title: "Google Ads & App Campaigns",
        text: "Google UAC, search, and YouTube. Tag Manager, GA4, server-side conversions, and cross-channel deduplication.",
      },
    ],
    techStack: [
      {
        label: "Ad Platforms",
        items: ["Meta Ads", "TikTok Ads", "Google Ads", "Apple Search Ads", "Reddit Ads"],
      },
      {
        label: "Attribution (MMPs)",
        items: ["AppsFlyer", "Adjust", "Branch", "Singular", "Kochava"],
      },
      {
        label: "Analytics",
        items: ["GA4", "Mixpanel", "Amplitude", "PostHog", "Looker Studio"],
      },
      {
        label: "Server-Side",
        items: ["Meta CAPI", "TikTok Events API", "Google Ads API", "Server GTM", "Stape"],
      },
      {
        label: "Creative",
        items: ["After Effects", "Figma", "CapCut", "Runway", "DaVinci Resolve"],
      },
      {
        label: "Tooling",
        items: ["Google Tag Manager", "Segment", "Iterable", "Customer.io"],
      },
    ],
    pricing: [
      {
        name: "Starter",
        price: "FROM £500",
        blurb: "Single-platform setup + first-month launch.",
        bullets: [
          "One ad channel (Meta or TikTok)",
          "Campaign, pixel, and event setup",
          "3 creative variants",
          "First-month monitoring",
        ],
      },
      {
        name: "Scale",
        price: "FROM £1.5K",
        blurb: "Multi-channel launch with attribution wiring.",
        highlighted: true,
        bullets: [
          "Meta + TikTok (or + Google)",
          "AppsFlyer / Adjust SDK integration",
          "Creative production + A/B structure",
          "Weekly reporting dashboard",
          "First month of spend management",
        ],
      },
      {
        name: "Retainer",
        price: "CUSTOM",
        blurb: "Ongoing growth operations, monthly cadence.",
        bullets: [
          "Dedicated growth operator",
          "Multi-channel portfolio management",
          "Creative iteration cycles",
          "LTV & payback modelling",
        ],
      },
    ],
    meta: [
      { label: "Channels", value: "Meta · TikTok · Google" },
      { label: "Attribution", value: "AppsFlyer · Adjust · Branch" },
      { label: "Cadence", value: "1-week setup, monthly cycles" },
    ],
  },

  // --------------------------------------------------------------------------
  {
    slug: "ai-integration",
    code: "C-03",
    badge: "LLM · RAG · AGENTS",
    title: "AI Integration",
    tagline: "Production LLM systems.",
    summary:
      "Agentic pipelines, retrieval-augmented generation, embeddings, structured tool-use, and prompt caching — across Anthropic, OpenAI, and open-weight models. We ship AI features that survive production, not demos.",
    positioning:
      "From a one-week pilot to a full production platform. Every engagement is scoped against a real workflow: cost model, evaluation harness, and a deployment plan — no vibe engineering.",
    services: [
      {
        code: "S-01",
        title: "LLM Feature Engineering",
        text: "Prompt architecture, caching, streaming, tool-use, structured outputs. Built against evaluations, not opinions.",
      },
      {
        code: "S-02",
        title: "Retrieval & RAG Pipelines",
        text: "Embedding stores (pgvector, Pinecone, Weaviate), hybrid search, re-ranking, chunking strategies tuned per corpus.",
      },
      {
        code: "S-03",
        title: "Agentic Automation",
        text: "Multi-step agents with tool orchestration, memory, human-in-the-loop checkpoints, and guardrails.",
      },
      {
        code: "S-04",
        title: "Voice & Multimodal",
        text: "Whisper, Deepgram, ElevenLabs, Claude Vision. Voice agents, transcription, image and document ingestion.",
      },
      {
        code: "S-05",
        title: "Evaluation & Monitoring",
        text: "Custom eval harnesses, regression tracking, cost dashboards, prompt versioning, drift detection.",
      },
      {
        code: "S-06",
        title: "Model Selection & Fine-Tuning",
        text: "Benchmarking across Claude, GPT, Gemini, Llama, Mistral. LoRA fine-tuning and distillation where it pays off.",
      },
    ],
    techStack: [
      {
        label: "Foundation models",
        items: ["Claude (Anthropic)", "GPT-4 / GPT-5 (OpenAI)", "Gemini", "Llama", "Mistral", "DeepSeek"],
      },
      {
        label: "Orchestration",
        items: ["Claude Agent SDK", "LangGraph", "Temporal", "Inngest", "LiteLLM"],
      },
      {
        label: "Retrieval",
        items: ["pgvector", "Pinecone", "Weaviate", "Qdrant", "Typesense"],
      },
      {
        label: "Voice & Vision",
        items: ["Whisper", "Deepgram", "ElevenLabs", "OpenAI Realtime", "Claude Vision"],
      },
      {
        label: "Infrastructure",
        items: ["Python", "TypeScript", "FastAPI", "Next.js", "Modal", "Replicate"],
      },
      {
        label: "Evaluation",
        items: ["Braintrust", "Langfuse", "promptfoo", "custom harnesses"],
      },
    ],
    pricing: [
      {
        name: "Pilot",
        price: "FROM £500",
        blurb: "Scoped prototype or feature spike.",
        bullets: [
          "One end-to-end workflow",
          "Prompt design + caching",
          "Cost & latency benchmarking",
          "Written recommendation report",
        ],
      },
      {
        name: "Integration",
        price: "FROM £1.5K",
        blurb: "Production LLM feature built to brief — scope to whatever the client needs.",
        highlighted: true,
        bullets: [
          "Scoped to client requirements",
          "Retrieval, tool-use, or agentic",
          "Eval harness & monitoring",
          "Deployed into your infrastructure",
          "30 days post-launch tuning",
        ],
      },
      {
        name: "Platform",
        price: "CUSTOM",
        blurb: "Dedicated AI programme, longer horizon, regulated domains.",
        bullets: [
          "Multi-pipeline architecture",
          "Dedicated evaluation infrastructure",
          "On-prem or VPC deployment",
          "Signed SLA",
        ],
      },
    ],
    meta: [
      { label: "Primary vendors", value: "Anthropic · OpenAI" },
      { label: "Languages", value: "Python · TypeScript" },
      { label: "Reference", value: "Creator AI" },
    ],
  },

  // --------------------------------------------------------------------------
  {
    slug: "web-platforms",
    code: "C-04",
    badge: "WEB · SAAS · BILLING",
    title: "Web & Platforms",
    tagline: "End-to-end web systems.",
    summary:
      "Next.js 16, Supabase, Stripe, and edge-native billing. Marketing sites that convert, product platforms that scale, and the plumbing — auth, payments, webhooks, email — wired together cleanly.",
    positioning:
      "From a precision landing page to a full multi-tenant SaaS. Every platform ships with observability, CI/CD, and a clear operating story from day one.",
    services: [
      {
        code: "S-01",
        title: "Landing & Marketing Sites",
        text: "Next.js + Tailwind. SEO-grade performance, CMS on demand, crisp motion, analytics and experimentation wired in.",
      },
      {
        code: "S-02",
        title: "SaaS Platforms",
        text: "Supabase + Next.js app router. Auth, RLS, row-level subscriptions, file storage, background jobs, admin consoles.",
      },
      {
        code: "S-03",
        title: "Billing & Subscriptions",
        text: "Stripe Billing, Apple / Google IAP, RevenueCat. Tax handling, dunning, webhooks, customer portals, invoice flows.",
      },
      {
        code: "S-04",
        title: "Authentication & Identity",
        text: "Sign in with Apple, Google, OAuth, magic link, passkeys. Organization / team models, invite flows, role hierarchies.",
      },
      {
        code: "S-05",
        title: "Internal Tools & Dashboards",
        text: "Admin panels, ops dashboards, automation consoles. Built fast without sacrificing architecture.",
      },
      {
        code: "S-06",
        title: "Integrations & Automation",
        text: "n8n workflows, Telegram bots, Slack apps, webhook relays, ETL pipelines. Connecting SaaS into your operations.",
      },
    ],
    techStack: [
      {
        label: "Frontend",
        items: ["Next.js 16", "React 19", "TypeScript", "Tailwind v4", "shadcn/ui", "HeroUI", "Framer Motion"],
      },
      {
        label: "Backend / Data",
        items: ["Supabase", "PostgreSQL", "Drizzle", "Prisma", "Redis", "Cloudflare D1"],
      },
      {
        label: "Payments",
        items: ["Stripe Billing", "Stripe Connect", "RevenueCat", "Apple IAP", "Google Play Billing"],
      },
      {
        label: "Auth",
        items: ["Supabase Auth", "Clerk", "Auth.js", "Passkeys / WebAuthn", "Sign in with Apple"],
      },
      {
        label: "Hosting",
        items: ["Vercel", "Cloudflare Pages", "Hostinger VPS", "Supabase Edge Functions"],
      },
      {
        label: "Automation",
        items: ["n8n", "Inngest", "Trigger.dev", "Telegram Bot API", "Resend / SMTP"],
      },
    ],
    pricing: [
      {
        name: "Landing",
        price: "FROM £800",
        blurb: "Precision landing or marketing site.",
        bullets: [
          "Up to 6 pages",
          "Custom design system",
          "Analytics + SEO + sitemap",
          "One round of content revisions",
        ],
      },
      {
        name: "Platform",
        price: "FROM £1.5K",
        blurb: "Full SaaS or product web app.",
        highlighted: true,
        bullets: [
          "Auth, billing, webhooks, email",
          "Admin / ops dashboard",
          "Supabase + Stripe wiring",
          "CI/CD, monitoring, staging",
          "30 days post-launch support",
        ],
      },
      {
        name: "Enterprise",
        price: "CUSTOM",
        blurb: "Multi-tenant, compliance-heavy, dedicated team.",
        bullets: [
          "Multi-region architecture",
          "SSO, audit logs, fine-grained RBAC",
          "SOC 2 / GDPR alignment",
          "Signed SLA",
        ],
      },
    ],
    meta: [
      { label: "Stack", value: "Next.js · Supabase · Stripe" },
      { label: "Typical TTM", value: "5–12 weeks" },
      { label: "Reference", value: "Simnetiq · ISR Shipping" },
    ],
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}

export function getAllServiceSlugs(): string[] {
  return services.map((s) => s.slug);
}
