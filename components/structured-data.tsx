import { lastModifiedFor } from "@/lib/content-dates";
import type { Locale } from "@/lib/i18n";
import { SITE_URL as BASE_URL } from "@/lib/site";

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${BASE_URL}/#organization`,
  name: "Simnetiq",
  legalName: "Simnetiq Ltd",
  alternateName: ["Simnetiq Ltd", "Simnetiq Technology Studio", "SIMNETIQ"],
  url: BASE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${BASE_URL}/icon-512.png`,
    width: 512,
    height: 512,
  },
  image: `${BASE_URL}/icon-512.png`,
  description:
    "Simnetiq is a London-based software engineering studio building high-integrity mobile apps, web platforms, AI systems, and VPN infrastructure for global clients.",
  foundingDate: "2025",
  founders: [
    {
      "@type": "Person",
      name: "Roman Pochtman",
      sameAs: ["https://www.linkedin.com/in/romanpochtman/"],
    },
    { "@type": "Person", name: "David Zitomirsky" },
  ],
  address: {
    "@type": "PostalAddress",
    streetAddress: "2 Frederick Street, Kings Cross",
    addressLocality: "London",
    addressRegion: "England",
    postalCode: "WC1X 0ND",
    addressCountry: "GB",
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@simnetiq.com",
      areaServed: "Worldwide",
      availableLanguage: ["English", "Hebrew", "Russian"],
    },
    {
      "@type": "ContactPoint",
      contactType: "sales",
      email: "support@simnetiq.com",
      areaServed: "Worldwide",
      availableLanguage: ["English", "Hebrew", "Russian"],
    },
  ],
  sameAs: [
    "https://www.instagram.com/simnetiq/",
    "https://find-and-update.company-information.service.gov.uk/company/16861177",
  ],
  identifier: [
    {
      "@type": "PropertyValue",
      propertyID: "Companies House (UK)",
      value: "16861177",
    },
  ],
};

const professionalService = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${BASE_URL}/#service`,
  name: "Simnetiq — Software Engineering Studio",
  url: BASE_URL,
  image: `${BASE_URL}/icon-512.png`,
  logo: `${BASE_URL}/icon-512.png`,
  description:
    "End-to-end product studio: iOS, Android, macOS, Windows and Linux applications; Next.js web platforms; LLM and AI integration; VPN and network infrastructure.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "2 Frederick Street, Kings Cross",
    addressLocality: "London",
    addressRegion: "England",
    postalCode: "WC1X 0ND",
    addressCountry: "GB",
  },
  geo: {
    "@type": "GeoCoordinates",
    // Street-level approximation for Frederick Street, WC1X 0ND.
    latitude: 51.5273,
    longitude: -0.1172,
  },
  areaServed: [
    { "@type": "Country", name: "United Kingdom" },
    { "@type": "Country", name: "Germany" },
    { "@type": "Country", name: "United States" },
    { "@type": "Place", name: "European Union" },
    { "@type": "Place", name: "Worldwide" },
  ],
  serviceType: [
    "Mobile app development",
    "iOS development",
    "Android development",
    "Desktop application development",
    "Web development",
    "Next.js development",
    "SaaS platform engineering",
    "AI integration",
    "LLM engineering",
    "RAG pipelines",
    "Agentic automation",
    "VPN infrastructure",
    "Network engineering",
    "Technical SEO",
    "App Store Optimisation",
  ],
  knowsAbout: [
    "Swift",
    "SwiftUI",
    "Kotlin",
    "Jetpack Compose",
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Python",
    "Go",
    "Supabase",
    "Stripe",
    "RevenueCat",
    "Anthropic Claude",
    "OpenAI",
    "pgvector",
    "LangGraph",
    "n8n",
    "Telegram Bot API",
    "VLESS-Reality",
    "Marzban",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Simnetiq Services",
    itemListElement: [
      {
        "@type": "OfferCatalog",
        name: "Mobile & Desktop",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "iOS and Android Application Development",
              serviceType: "Mobile app development",
              url: `${BASE_URL}/en/services/mobile-desktop`,
            },
          },
        ],
      },
      {
        "@type": "OfferCatalog",
        name: "AI & Automation",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "AI features, n8n pipelines, agentic workflows",
              serviceType: "AI engineering and automation",
              url: `${BASE_URL}/en/services/ai-automation`,
            },
          },
        ],
      },
      {
        "@type": "OfferCatalog",
        name: "Web & Platforms",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Landing Pages, SaaS Platforms, Billing and Auth",
              serviceType: "Web development",
              url: `${BASE_URL}/en/services/web-platforms`,
            },
          },
        ],
      },
    ],
  },
  parentOrganization: { "@id": `${BASE_URL}/#organization` },
};

const website = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${BASE_URL}/#website`,
  url: BASE_URL,
  name: "Simnetiq",
  description:
    "London software engineering studio. Mobile, web, AI and infrastructure.",
  publisher: { "@id": `${BASE_URL}/#organization` },
  inLanguage: "en-GB",
};

export function OrganizationSchema() {
  return (
    <script
      id="ld-organization"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
    />
  );
}

export function ProfessionalServiceSchema() {
  return (
    <script
      id="ld-professional-service"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalService) }}
    />
  );
}

export function WebsiteSchema() {
  return (
    <script
      id="ld-website"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
    />
  );
}

export function GlobalStructuredData() {
  return (
    <>
      <OrganizationSchema />
      <ProfessionalServiceSchema />
      <WebsiteSchema />
    </>
  );
}

type BreadcrumbItem = { name: string; url: string };

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
  return (
    <script
      id={`ld-breadcrumb-${items.map((i) => i.name).join("-").toLowerCase().replace(/\s+/g, "-")}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

type FaqSchemaInput = {
  items: { q: string; a: string }[];
  /** Path after the locale segment, e.g. "/how-we-work/code-ownership". */
  path: string;
  locale: Locale;
};

/**
 * FAQPage markup for a page whose questions and answers are visible on the page
 * itself — Google requires the marked-up text to be present in the rendered HTML.
 *
 * The `@id` carries the locale (matching CaseStudyArticleSchema) so the three
 * language variants of a page don't collide on one identifier.
 */
export function FaqSchema({ items, path, locale }: FaqSchemaInput) {
  const url = `${BASE_URL}/${locale}${path}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    url,
    inLanguage: locale,
    isPartOf: { "@id": `${BASE_URL}/#website` },
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
  return (
    <script
      id={`ld-faq-${locale}${path.replace(/\//g, "-")}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Plain service categories per service slug. Kept separate from the pages'
 * meta-keyword lists: `serviceType` names what the service is, without place
 * names or search phrases.
 */
const SERVICE_TYPES_BY_SLUG: Record<string, string[]> = {
  "mobile-desktop": [
    "Mobile app development",
    "iOS app development",
    "Android app development",
    "Desktop app development",
    "Cross-platform app development",
  ],
  "web-platforms": [
    "Website development",
    "Web application development",
    "SaaS development",
    "Payment and subscription integration",
    "Internal tools development",
  ],
  "ai-automation": [
    "AI integration",
    "Workflow automation",
    "Business process automation",
    "LLM application development",
    "Systems integration",
  ],
};

type ServiceSchemaInput = {
  name: string;
  slug: string;
  summary: string;
  locale?: Locale;
};

export function ServiceSchema({
  name,
  slug,
  summary,
  locale = "en",
}: ServiceSchemaInput) {
  const url = `${BASE_URL}/${locale}/services/${slug}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: `${name} — Simnetiq`,
    description: summary,
    url,
    inLanguage: locale,
    provider: { "@id": `${BASE_URL}/#organization` },
    areaServed: [
      { "@type": "Country", name: "United Kingdom" },
      { "@type": "Country", name: "Germany" },
      { "@type": "Country", name: "United States" },
      { "@type": "Place", name: "Worldwide" },
    ],
    serviceType: SERVICE_TYPES_BY_SLUG[slug],
  };
  return (
    <script
      id={`ld-service-${slug}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

type CaseStudySchemaInput = {
  /** Article headline (page title without site suffix). */
  headline: string;
  /** Path under the site root, e.g. "/projects/doppler-vpn". */
  path: string;
  /** Short description / dek. */
  description: string;
  /** Hero image URL — absolute or root-relative. */
  image: string;
  /** Locale, used to set inLanguage and pick canonical alternates. */
  locale: Locale;
  /** ISO date — first published. Defaults to studio founding year. */
  datePublished?: string;
  /** ISO date — last meaningful edit. Defaults to the route's entry in lib/content-dates. */
  dateModified?: string;
  /** Tags / keywords for the article. */
  keywords?: string[];
};

export function CaseStudyArticleSchema({
  headline,
  path,
  description,
  image,
  locale,
  datePublished = "2025-01-01",
  dateModified,
  keywords,
}: CaseStudySchemaInput) {
  const url = `${BASE_URL}/${locale}${path}`;
  const absoluteImage = image.startsWith("http")
    ? image
    : `${BASE_URL}${image}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline,
    description,
    image: [absoluteImage],
    datePublished,
    dateModified: dateModified ?? lastModifiedFor(path),
    inLanguage: { en: "en-GB", he: "he-IL", ru: "ru-RU" }[locale],
    author: { "@id": `${BASE_URL}/#organization` },
    publisher: { "@id": `${BASE_URL}/#organization` },
    isPartOf: { "@id": `${BASE_URL}/#website` },
    keywords: keywords?.join(", "),
    url,
  };
  return (
    <script
      id={`ld-article-${path.replace(/\//g, "-")}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

type ProjectItem = {
  name: string;
  url: string;
  description: string;
};

export function PortfolioSchema({ items }: { items: ProjectItem[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${BASE_URL}/en/projects#portfolio`,
    name: "Simnetiq deployments",
    itemListElement: items.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "CreativeWork",
        name: p.name,
        url: p.url,
        description: p.description,
        creator: { "@id": `${BASE_URL}/#organization` },
      },
    })),
  };
  return (
    <script
      id="ld-portfolio"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
