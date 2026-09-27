import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PageHeader } from "@/components/page-header";
import { notFound } from "next/navigation";
import { TechnologyChips } from "@/components/technology-chips";
import { CardArrow } from "@/components/sections/card-arrow";
import { ProjectStatus } from "@/components/project-status";
import styles from "@/components/projects.module.css";
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
        <div className={styles.directory}>
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
              <article key={proj.id} className={styles.card} aria-labelledby={`project-${proj.key}`}>
                <header className={styles.cardHeader}>
                  <div className={styles.category}>
                    <span className={styles.index}>{proj.id}</span>
                    <span>{item.badge}</span>
                  </div>
                  <ProjectStatus project={proj.key} labels={p.statuses} />
                </header>
                <div className={`${styles.cardBody} ${!proj.image ? styles.withoutImage : ""}`}>
                  <div className={styles.copy}>
                    <div className={styles.titleRow}>
                      {hasProjectLogo(proj.key) && (
                        <ProjectLogo project={proj.key} alt="" size={32} />
                      )}
                      <h2 id={`project-${proj.key}`} className={styles.title}>{item.title}</h2>
                    </div>
                    <p className={`text-body ${styles.description}`}>{item.description}</p>
                    <TechnologyChips technologies={proj.tags} label={dict.projects.stack} />
                    <div className={styles.actions}>
                      <Link
                        href={primaryHref}
                        target={primaryExternal ? "_blank" : undefined}
                        rel={primaryExternal ? "noopener noreferrer" : undefined}
                        className={styles.primaryLink}
                      >
                        {p[proj.link.labelKey]}
                        <CardArrow external={primaryExternal} />
                      </Link>
                      {proj.secondaryLink && secondaryHref && (
                        <Link
                          href={secondaryHref}
                          target={secondaryExternal ? "_blank" : undefined}
                          rel={secondaryExternal ? "noopener noreferrer" : undefined}
                          className={styles.secondaryLink}
                        >
                          {p[proj.secondaryLink.labelKey]}
                          <CardArrow external={secondaryExternal} />
                        </Link>
                      )}
                    </div>
                  </div>
                  {proj.image && (
                    <Link
                      href={primaryHref}
                      target={primaryExternal ? "_blank" : undefined}
                      rel={primaryExternal ? "noopener noreferrer" : undefined}
                      className={styles.media}
                      aria-label={`${p[proj.link.labelKey]}: ${item.title}`}
                    >
                      <Image
                        src={proj.image}
                        alt=""
                        loading={proj.key === "argus" ? "eager" : "lazy"}
                        fill
                        sizes="(min-width: 1440px) 600px, (min-width: 1024px) 44vw, 90vw"
                        className={styles.image}
                      />
                      <span className={styles.mediaArrow} aria-hidden="true"><CardArrow external={primaryExternal} /></span>
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
