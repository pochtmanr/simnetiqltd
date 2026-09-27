"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { localizePath, type Locale } from "@/lib/i18n";
import styles from "./landing-sections.module.css";
import { TechnologyChips } from "@/components/technology-chips";
import { CardArrow } from "./card-arrow";

type ProjectKey =
  | "argus"
  | "physics"
  | "doppler"
  | "creator"
  | "delivery"
  | "greenflagged"
  | "smscode"
  | "visapassage";

type ProjectDef = {
  key: ProjectKey;
  id: string;
  href: string;
  caseStudy?: string;
  stack: string;
  appStore?: string;
  googlePlay?: string;
  /** Case-study header art. The last two projects have no mark or shot yet. */
  image?: string;
};

const PROJECTS: ProjectDef[] = [
  {
    key: "argus",
    image: "/argus-header.avif",
    id: "01",
    href: "https://www.browserargus.com/",
    caseStudy: "/projects/argus-browser",
    stack: "C++ · Chromium · Electron · React · Supabase",
  },
  {
    key: "physics",
    appStore: "https://apps.apple.com/app/id6793272026",
    image: "/physics-header.avif",
    id: "02",
    href: "https://physics.it.com/",
    caseStudy: "/projects/physics-explained",
    stack: "Next.js · WebGL · MathJax · odex",
  },
  {
    key: "doppler",
    appStore: "https://apps.apple.com/us/app/doppler-vpn-fast-secure/id6757091773",
    googlePlay: "https://play.google.com/store/apps/details?id=org.dopplervpn.android",
    image: "/doppler-header.avif",
    id: "03",
    href: "https://dopplervpn.org",
    caseStudy: "/projects/doppler-vpn",
    stack: "Swift · Kotlin · Go · Marzban",
  },
  {
    key: "smscode",
    appStore: "https://apps.apple.com/us/app/id6803515179",
    image: "/smscode-header.avif",
    id: "04",
    href: "https://simnetiq.xyz/",
    caseStudy: "/projects/sms-code",
    stack: "Next.js · React · Tailwind · iOS",
  },
  {
    key: "visapassage",
    image: "/visapassage-header.avif",
    id: "05",
    href: "https://visapassage.com/",
    caseStudy: "/projects/visapassage",
    stack: "Next.js · React · Supabase · Tailwind",
  },
  {
    key: "greenflagged",
    image: "/greenflagged-header.avif",
    id: "06",
    href: "https://greenflagged.vercel.app/",
    caseStudy: "/projects/green-flagged",
    stack: "Next.js 16 · React 19 · Tailwind v4 · GSAP",
  },
  {
    key: "delivery",
    id: "07",
    href: "https://www.isrshipping.com",
    stack: "Next.js · Node · PostgreSQL",
  },
  {
    key: "creator",
    id: "08",
    href: "https://www.creatorai.art/en",
    stack: "Swift · Kotlin · Python · Supabase",
  },
];

type RecentWorkDict = {
  projects: {
    eyebrow: string;
    title: string;
    body: string;
    stack: string;
    visit: string;
    caseStudy: string;
    seeAll: string;
    seeLess: string;
    items: Record<
      ProjectKey,
      { title: string; badge: string; description: string; accolade?: string }
    >;
  };
};

export function RecentWorkSection({
  locale,
  dict,
}: {
  locale: Locale;
  dict: RecentWorkDict;
}) {
  const [showAll, setShowAll] = useState(false);

  return (
    <>
      <div className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{dict.projects.title}</h2>
          <p className={styles.sectionDescription}>{dict.projects.body}</p>
        </header>

        <div id="recent-work-grid" className={styles.projectGrid}>
          {PROJECTS.filter((project) => showAll || project.image).map((project) => {
            const meta = dict.projects.items[project.key];
            const isExternal = project.href.startsWith("http");
            return (
              <article
                key={project.id}
                className={`${styles.projectCard} ${!project.image ? styles.projectCompact : ""}`}
                aria-labelledby={`project-${project.key}`}
              >
                {project.image && (
                  <Link
                    href={project.caseStudy ? localizePath(locale, project.caseStudy) : project.href}
                    className={`${styles.projectImage} relative aspect-[16/9] overflow-hidden`}
                    aria-label={`${dict.projects.caseStudy}: ${meta.title}`}
                  >
                    <Image
                      src={project.image}
                      alt=""
                      fill
                      sizes="(min-width: 1440px) 432px, (min-width: 1100px) 30vw, (min-width: 768px) 45vw, 100vw"
                      className="object-cover"
                    />
                  </Link>
                )}
                <div className={styles.projectMeta}>
                  <span>{meta.badge}</span>
                  <span className={styles.number} aria-hidden="true">{project.id}</span>
                </div>
                <h3 id={`project-${project.key}`} className={styles.projectTitle}>{meta.title}</h3>
                {meta.accolade && (
                  <div className={styles.accolade}>
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"
                      aria-hidden="true"
                      className="text-[var(--color-text-dim)]"
                    >
                      <path d="M17.5 13.5c-.02-2.4 1.96-3.55 2.05-3.6-1.12-1.64-2.86-1.86-3.48-1.89-1.48-.15-2.89.87-3.64.87-.76 0-1.92-.85-3.16-.83-1.62.02-3.12.94-3.95 2.4-1.69 2.93-.43 7.27 1.21 9.65.81 1.16 1.77 2.46 3.04 2.41 1.22-.05 1.68-.79 3.16-.79 1.47 0 1.89.79 3.18.77 1.31-.02 2.14-1.18 2.94-2.34.93-1.34 1.31-2.65 1.33-2.72-.03-.01-2.55-.98-2.58-3.93zM15.05 6.45c.66-.81 1.11-1.93.99-3.05-.96.04-2.13.64-2.82 1.45-.62.71-1.16 1.86-1.02 2.95 1.07.08 2.18-.55 2.85-1.35z" />
                    </svg>
                    <span>
                      {meta.accolade}
                    </span>
                  </div>
                )}
                <p className={styles.projectDescription}>
                  {meta.description}
                </p>
                <div className={styles.projectFooter}>
                  <TechnologyChips technologies={project.stack.split(" · ")} label={dict.projects.stack} />
                  <div className={styles.projectActions}>
                    {project.caseStudy && (
                      <Link
                        href={localizePath(locale, project.caseStudy)}
                        className={styles.projectCaseStudy}
                        aria-label={`${dict.projects.caseStudy}: ${meta.title}`}
                      >
                        {dict.projects.caseStudy}
                        <CardArrow />
                      </Link>
                    )}
                    <div className={styles.projectUtilities}>
                      {([ ["App Store", project.appStore], ["Google Play", project.googlePlay] ] as const).map(([store, href]) => href && (
                        <a key={store} href={href} target="_blank" rel="noopener noreferrer"
                          className={styles.projectStore} title={`${meta.title} · ${store}`}
                          aria-label={`${meta.title} · ${store}`}>
                          <StoreIcon store={store} />
                        </a>
                      ))}
                    <Link
                      href={project.href}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                      onClick={() =>
                        track("project_card_click", {
                          project_id: project.key,
                          locale,
                        })
                      }
                      className={styles.projectVisit}
                      title={`${dict.projects.visit}: ${meta.title}`}
                      aria-label={`${dict.projects.visit}: ${meta.title}`}
                    >
                      <CardArrow external={isExternal} />
                    </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        <button
          type="button"
          className={styles.workToggle}
          aria-expanded={showAll}
          aria-controls="recent-work-grid"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? dict.projects.seeLess : dict.projects.seeAll}
          <span aria-hidden="true">{showAll ? "−" : "+"}</span>
        </button>
      </div>
    </>
  );
}

function StoreIcon({ store }: { store: "App Store" | "Google Play" }) {
  return store === "App Store" ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="m10 6 7 12M14 6l-5.2 9M7 18l.7-1.2M6 15h8m2 0h2" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 3.5v17L20 12 4 3.5Z" />
      <path d="m4 3.5 11 11M4 20.5l11-11" />
    </svg>
  );
}
