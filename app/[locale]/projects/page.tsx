import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel, Rail, SpecRow } from "@/components/panel";
import {
  BreadcrumbSchema,
  PortfolioSchema,
} from "@/components/structured-data";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, localizePath, type Locale } from "@/lib/i18n";
import { buildLocalizedMetadata } from "@/lib/seo-meta";

const SITE_URL = "https://simnetiq.store";

const PROJECTS_KEYWORDS = [
  "Simnetiq projects",
  "Simnetiq portfolio",
  "Simnetiq case studies",
  "Simnetiq deployments",
  "Doppler VPN",
  "DopplerVPN",
  "VLESS Reality VPN app",
  "zero-log VPN",
  "Creator AI",
  "creatorai.art",
  "LLM content platform",
  "AI content agency portfolio",
  "Physics.explained",
  "physics.it.com",
  "open source physics learning",
  "ISR Shipping",
  "Go Delivery logistics",
  "delivery platform case study",
  "London software portfolio",
  "production app case studies",
  "iOS app portfolio UK",
  "Android app portfolio UK",
  "Next.js production case studies",
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? (rawLocale as Locale) : "en";
  return buildLocalizedMetadata({
    locale,
    routeKey: "projects",
    path: "/projects",
    keywords: PROJECTS_KEYWORDS,
  });
}

type ProjectKey = "physics" | "doppler" | "creator" | "delivery";

type ProjectStruct = {
  key: ProjectKey;
  id: string;
  tags: string[];
  link: { kind: "internal" | "external"; href: string; labelKey: "readCaseStudy" | "visitSite" };
  secondaryLink?: { kind: "internal" | "external"; href: string; labelKey: "readCaseStudy" | "visitSite" };
  metaKeys: { labelKey: string; valueKey: string }[];
};

const projectsList: ProjectStruct[] = [
  {
    key: "physics",
    id: "01",
    tags: ["NEXT.JS", "WEBGL", "MATHJAX", "AI"],
    link: { kind: "internal", href: "/projects/physics-explained", labelKey: "readCaseStudy" },
    secondaryLink: { kind: "external", href: "https://physics.it.com/", labelKey: "visitSite" },
    metaKeys: [
      { labelKey: "deployed", valueKey: "deployedValue" },
      { labelKey: "coverage", valueKey: "coverageValue" },
      { labelKey: "tutor", valueKey: "tutorValue" },
    ],
  },
  {
    key: "doppler",
    id: "02",
    tags: ["SWIFT", "KOTLIN", "GO", "MARZBAN"],
    link: { kind: "internal", href: "/projects/doppler-vpn", labelKey: "readCaseStudy" },
    secondaryLink: { kind: "external", href: "https://dopplervpn.org", labelKey: "visitSite" },
    metaKeys: [
      { labelKey: "deployed", valueKey: "deployedValue" },
      { labelKey: "protocol", valueKey: "protocolValue" },
      { labelKey: "platforms", valueKey: "platformsValue" },
    ],
  },
  {
    key: "creator",
    id: "03",
    tags: ["SWIFT", "KOTLIN", "PYTHON", "SUPABASE"],
    link: { kind: "external", href: "https://www.creatorai.art/en", labelKey: "visitSite" },
    metaKeys: [
      { labelKey: "deployed", valueKey: "deployedValue" },
      { labelKey: "models", valueKey: "modelsValue" },
      { labelKey: "platforms", valueKey: "platformsValue" },
    ],
  },
  {
    key: "delivery",
    id: "04",
    tags: ["NEXT.JS", "REACT", "NODE", "POSTGRES"],
    link: { kind: "external", href: "https://www.isrshipping.com", labelKey: "visitSite" },
    metaKeys: [
      { labelKey: "deployed", valueKey: "deployedValue" },
      { labelKey: "market", valueKey: "marketValue" },
      { labelKey: "scope", valueKey: "scopeValue" },
    ],
  },
];

type Params = Promise<{ locale: string }>;

export default async function ProjectsPage({ params }: { params: Params }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);
  const p = dict.projectsPage;

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: `${SITE_URL}/${locale}` },
          { name: "Projects", url: `${SITE_URL}/${locale}/projects` },
        ]}
      />
      <PortfolioSchema
        items={projectsList.map((proj) => {
          const item = p.items[proj.key];
          return {
            name: item.title,
            url:
              proj.link.kind === "external"
                ? proj.link.href
                : `${SITE_URL}${proj.link.href}`,
            description: item.description,
          };
        })}
      />
      {/* Hero */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 pt-12 lg:pt-20 pb-16 lg:pb-24">
          <Rail
            items={[p.rail.index, p.rail.archive, p.rail.active]}
            className="mb-10"
          />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <p className="text-label text-[var(--color-primary-glow)]">
                {p.eyebrow}
              </p>
              <h1 className="text-display mt-6">
                <span className="block">{p.titleLine1}</span>
                <span className="block text-[var(--color-text-dim)]">
                  {p.titleLine2}
                </span>
              </h1>
            </div>
            <div className="lg:col-span-5 self-end">
              <p className="text-body max-w-md">{p.body}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Project cards */}
      <section>
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12 lg:py-20 space-y-8 lg:space-y-10">
          {projectsList.map((proj) => {
            const item = p.items[proj.key];
            const meta = item as unknown as Record<string, string>;
            const primaryHref =
              proj.link.kind === "internal"
                ? localizePath(locale, proj.link.href)
                : proj.link.href;
            const primaryExternal = proj.link.kind === "external";
            const secondaryHref = proj.secondaryLink
              ? proj.secondaryLink.kind === "internal"
                ? localizePath(locale, proj.secondaryLink.href)
                : proj.secondaryLink.href
              : null;
            const secondaryExternal =
              proj.secondaryLink?.kind === "external";

            return (
              <article key={proj.id} className="group">
                <Panel innerClassName="p-6 lg:p-10" corners>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    <div className="lg:col-span-7">
                      <div className="flex items-center justify-between mb-8">
                        <span className="text-mono text-[var(--color-text-faint)]">
                          {proj.id} · ENTRY
                        </span>
                        <span className="text-label-sm text-[var(--color-primary-glow)]">
                          {item.badge}
                        </span>
                      </div>
                      <h2 className="text-headline mb-5">{item.title}</h2>
                      <p className="text-body mb-8 max-w-lg">
                        {item.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-8">
                        {proj.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-label-sm text-[var(--color-text-dim)] border border-[var(--color-border-strong)] px-3 py-1.5"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          href={primaryHref}
                          target={primaryExternal ? "_blank" : undefined}
                          rel={primaryExternal ? "noopener noreferrer" : undefined}
                          className="btn-primary"
                        >
                          {p[proj.link.labelKey]}
                          <span>{primaryExternal ? "↗" : "→"}</span>
                        </Link>
                        {proj.secondaryLink && secondaryHref && (
                          <Link
                            href={secondaryHref}
                            target={secondaryExternal ? "_blank" : undefined}
                            rel={secondaryExternal ? "noopener noreferrer" : undefined}
                            className="btn-secondary"
                          >
                            {p[proj.secondaryLink.labelKey]}
                            <span>{secondaryExternal ? "↗" : "→"}</span>
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-5">
                      <div className="border-l border-[var(--color-border)] lg:pl-10">
                        <p className="text-label-sm text-[var(--color-text-faint)] mb-4">
                          {p.specification}
                        </p>
                        {proj.metaKeys.map((m) => (
                          <SpecRow
                            key={m.labelKey}
                            label={meta[m.labelKey]}
                            value={meta[m.valueKey]}
                          />
                        ))}
                        <div className="mt-6 flex items-center gap-2">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary-glow)] pulse-dot" />
                          <span className="text-mono text-[var(--color-primary-glow)]">
                            {dict.common.liveNominal}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Panel>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
