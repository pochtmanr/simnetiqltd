const BASE_URL = "https://simnetiq.store";

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
    "Simnetiq is a London-based software engineering and growth marketing studio building high-integrity mobile apps, web platforms, AI systems, and VPN infrastructure for global clients.",
  foundingDate: "2025",
  founders: [
    { "@type": "Person", name: "Roman Pochtman" },
    { "@type": "Person", name: "Dmitry Polskoy" },
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
      email: "support@simnetiq.store",
      areaServed: "Worldwide",
      availableLanguage: ["English"],
    },
    {
      "@type": "ContactPoint",
      contactType: "sales",
      email: "support@simnetiq.store",
      areaServed: "Worldwide",
      availableLanguage: ["English"],
    },
  ],
  sameAs: [
    "https://www.instagram.com/simnetiq/",
    "https://www.linkedin.com/in/romanpochtman/",
  ],
  identifier: [
    {
      "@type": "PropertyValue",
      propertyID: "Companies House (UK)",
      value: "16861177",
    },
  ],
  vatID: "On request",
  taxID: "16861177",
};

const professionalService = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${BASE_URL}/#service`,
  name: "Simnetiq — Software Engineering & Growth Marketing Studio",
  url: BASE_URL,
  image: `${BASE_URL}/icon-512.png`,
  logo: `${BASE_URL}/icon-512.png`,
  description:
    "End-to-end product studio: iOS, Android, macOS, Windows and Linux applications; Next.js web platforms; LLM and AI integration; paid acquisition across Meta, TikTok and Google; VPN and network infrastructure.",
  priceRange: "£££",
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
    latitude: 51.5074,
    longitude: -0.1278,
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
    "Growth marketing",
    "Paid acquisition",
    "Meta ads management",
    "TikTok ads management",
    "Google Ads management",
    "AppsFlyer integration",
    "Adjust integration",
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
    "AppsFlyer",
    "Adjust",
    "Meta Ads",
    "TikTok Ads",
    "Google Ads",
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
              url: `${BASE_URL}/services/mobile-desktop`,
            },
            priceCurrency: "GBP",
            price: "1000",
            priceSpecification: {
              "@type": "PriceSpecification",
              priceCurrency: "GBP",
              price: "1000",
              minPrice: "1000",
            },
          },
        ],
      },
      {
        "@type": "OfferCatalog",
        name: "Growth & Marketing",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Paid Acquisition and Attribution",
              serviceType: "Performance marketing",
              url: `${BASE_URL}/services/growth-marketing`,
            },
            priceCurrency: "GBP",
            price: "500",
          },
        ],
      },
      {
        "@type": "OfferCatalog",
        name: "AI Integration",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "LLM, RAG and Agentic Automation",
              serviceType: "AI engineering",
              url: `${BASE_URL}/services/ai-integration`,
            },
            priceCurrency: "GBP",
            price: "500",
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
              url: `${BASE_URL}/services/web-platforms`,
            },
            priceCurrency: "GBP",
            price: "800",
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
    "London software engineering and growth marketing studio. Mobile, web, AI and infrastructure.",
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

type ServiceSchemaInput = {
  name: string;
  slug: string;
  summary: string;
  serviceTypes?: string[];
  priceFrom?: string;
};

export function ServiceSchema({
  name,
  slug,
  summary,
  serviceTypes,
  priceFrom,
}: ServiceSchemaInput) {
  const url = `${BASE_URL}/services/${slug}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: `${name} — Simnetiq`,
    description: summary,
    url,
    provider: { "@id": `${BASE_URL}/#organization` },
    areaServed: [
      { "@type": "Country", name: "United Kingdom" },
      { "@type": "Country", name: "Germany" },
      { "@type": "Country", name: "United States" },
      { "@type": "Place", name: "Worldwide" },
    ],
    serviceType: serviceTypes,
    offers: priceFrom
      ? {
          "@type": "Offer",
          priceCurrency: "GBP",
          price: priceFrom,
          url,
        }
      : undefined,
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
  locale: "en" | "he";
  /** ISO date — first published. Defaults to studio founding year. */
  datePublished?: string;
  /** ISO date — last meaningful edit. */
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
    dateModified: dateModified ?? datePublished,
    inLanguage: locale === "he" ? "he-IL" : "en-GB",
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
    "@id": `${BASE_URL}/projects#portfolio`,
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
