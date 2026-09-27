import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PageHeader } from "@/components/page-header";
import { notFound } from "next/navigation";
import { TechnologyChips } from "@/components/technology-chips";
import { CardArrow } from "@/components/sections/card-arrow";
import { Panel } from "@/components/panel";
import { hasProjectLogo, ProjectLogo } from "@/components/project-logo";
import {
  BreadcrumbSchema,
  PortfolioSchema,
} from "@/components/structured-data";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, localizePath, type Locale } from "@/lib/i18n";
import { buildLocalizedMetadata } from "@/lib/seo-meta";
import { SITE_URL } from "@/lib/site";

const PROJECTS_KEYWORDS = [
  "Simnetiq projects",
  "Argus Browser",
  "browserargus.com",
  "anti-detect browser",
  "Chromium fork",
  "browser fingerprinting",
  "multi-account browser",
  "browser automation platform",
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
  "Green Flagged",
  "AI contract review",
  "contract reviewer for freelancers",
  "legal-tech case study",
  "SMS Code",
  "SMS Activate",
  "simnetiq.xyz",
  "virtual numbers",
  "SMS verification numbers",
  "temporary phone number",
  "VisaPassage",
  "visapassage.com",
  "multi-passport visa comparison",
  "visa requirements comparison",
  "visa document checklist",
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
    markdownAlternate: true,
  });
}

type ProjectKey =
  | "argus"
  | "physics"
  | "doppler"
  | "creator"
  | "delivery"
  | "greenflagged"
  | "smscode"
  | "visapassage";

type ProjectStruct = {
  key: ProjectKey;
  id: string;
  image?: string;
  tags: string[];
  link: { kind: "internal" | "external"; href: string; labelKey: "readCaseStudy" | "visitSite" };
  secondaryLink?: { kind: "internal" | "external"; href: string; labelKey: "readCaseStudy" | "visitSite" };
};

const projectsList: ProjectStruct[] = [
  {
    key: "argus",
    image: "/argus-header.avif",
    id: "01",
    tags: ["C++", "Chromium", "Electron", "React", "Supabase"],
    link: { kind: "internal", href: "/projects/argus-browser", labelKey: "readCaseStudy" },
    secondaryLink: { kind: "external", href: "https://www.browserargus.com/", labelKey: "visitSite" },
  },
  {
    key: "physics",
    image: "/physics-header.avif",
    id: "02",
    tags: ["Next.js", "WebGL", "MathJax", "AI"],
    link: { kind: "internal", href: "/projects/physics-explained", labelKey: "readCaseStudy" },
    secondaryLink: { kind: "external", href: "https://physics.it.com/", labelKey: "visitSite" },
  },
  {
    key: "doppler",
    image: "/doppler-header.avif",
    id: "03",
    tags: ["Swift", "Kotlin", "Go", "Marzban"],
    link: { kind: "internal", href: "/projects/doppler-vpn", labelKey: "readCaseStudy" },
    secondaryLink: { kind: "external", href: "https://dopplervpn.org", labelKey: "visitSite" },
  },
  {
    key: "smscode",
    image: "/smscode-header.avif",
    id: "04",
    tags: ["Next.js", "React", "Tailwind", "iOS"],
    link: { kind: "internal", href: "/projects/sms-code", labelKey: "readCaseStudy" },
    secondaryLink: { kind: "external", href: "https://simnetiq.xyz/", labelKey: "visitSite" },
  },
  {
    key: "visapassage",
    image: "/visapassage-header.avif",
    id: "05",
    tags: ["Next.js", "React", "Supabase", "Tailwind"],
    link: { kind: "internal", href: "/projects/visapassage", labelKey: "readCaseStudy" },
    secondaryLink: { kind: "external", href: "https://visapassage.com/", labelKey: "visitSite" },
  },
  {
    key: "greenflagged",
    image: "/greenflagged-header.avif",
    id: "06",
    tags: ["Next.js 16", "React 19", "Tailwind v4", "GSAP"],
    link: { kind: "internal", href: "/projects/green-flagged", labelKey: "readCaseStudy" },
    secondaryLink: { kind: "external", href: "https://greenflagged.vercel.app/", labelKey: "visitSite" },
  },
  {
    key: "delivery",
    id: "07",
    tags: ["Next.js", "React", "Node.js", "PostgreSQL"],
    link: { kind: "external", href: "https://www.isrshipping.com", labelKey: "visitSite" },
  },
  {
    key: "creator",
    id: "08",
    tags: ["Swift", "Kotlin", "Python", "Supabase"],
    link: { kind: "external", href: "https://www.creatorai.art/en", labelKey: "visitSite" },
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
      <PageHeader title={p.titleLine1} subtitle={p.titleLine2} description={p.body} />

      {/* Project cards */}
      <section>
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 pt-4 pb-16 lg:pb-28 space-y-6 lg:space-y-8">
          {projectsList.map((proj) => {
            const item = p.items[proj.key];
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
                <Panel innerClassName="p-6 sm:p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                    <div className="lg:col-span-7">
                      <div className="flex items-center justify-between gap-4 mb-6">
                        {/* min-height keeps the header row aligned across
                            entries whose project has no supplied mark. */}
                        <div className="flex items-center gap-3 min-h-9">
                          {hasProjectLogo(proj.key) && (
                            <ProjectLogo
                              project={proj.key}
                              alt={item.title}
                              size={30}
                            />
                          )}
                          <span className="text-xs text-[var(--color-text-dim)] tabular-nums">
                            {proj.id}
                          </span>
                        </div>
                        <span className="text-xs text-end text-[var(--color-text-dim)]">
                          {item.badge}
                        </span>
                      </div>
                      <h2 className="text-headline mb-4">{item.title}</h2>
                      <p className="text-body mb-6 max-w-lg">
                        {item.description}
                      </p>
                      <TechnologyChips technologies={proj.tags} label={dict.projects.stack} />
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          href={primaryHref}
                          target={primaryExternal ? "_blank" : undefined}
                          rel={primaryExternal ? "noopener noreferrer" : undefined}
                          className="btn-primary"
                        >
                          {p[proj.link.labelKey]}
                          <CardArrow external={primaryExternal} />
                        </Link>
                        {proj.secondaryLink && secondaryHref && (
                          <Link
                            href={secondaryHref}
                            target={secondaryExternal ? "_blank" : undefined}
                            rel={secondaryExternal ? "noopener noreferrer" : undefined}
                            className="btn-secondary"
                          >
                            {p[proj.secondaryLink.labelKey]}
                            <CardArrow external={secondaryExternal} />
                          </Link>
                        )}
                      </div>
                    </div>

                    {proj.image && (
                      <div className="lg:col-span-5 min-w-0">
                        <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-[var(--color-border)]">
                          <Image
                            src={proj.image}
                            alt=""
                            fill
                            sizes="(min-width: 1440px) 460px, (min-width: 1024px) 36vw, 90vw"
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}
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
