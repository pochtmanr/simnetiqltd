"use client";

import Link from "next/link";
import { Panel } from "@/components/panel";
import { track } from "@/lib/analytics";
import { localizePath, type Locale } from "@/lib/i18n";

type ProjectKey = "physics" | "doppler" | "creator" | "delivery";

type ProjectDef = {
  key: ProjectKey;
  id: string;
  href: string;
  caseStudy?: string;
  stack: string;
};

const PROJECTS: ProjectDef[] = [
  {
    key: "physics",
    id: "01",
    href: "https://physics.it.com/",
    caseStudy: "/projects/physics-explained",
    stack: "Next.js · WebGL · MathJax · odex",
  },
  {
    key: "doppler",
    id: "02",
    href: "https://dopplervpn.org",
    caseStudy: "/projects/doppler-vpn",
    stack: "Swift · Kotlin · Go · Marzban",
  },
  {
    key: "creator",
    id: "03",
    href: "https://www.creatorai.art/en",
    stack: "Swift · Kotlin · Python · Supabase",
  },
  {
    key: "delivery",
    id: "04",
    href: "https://www.isrshipping.com",
    stack: "Next.js · Node · PostgreSQL",
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
  return (
    <section
      id="projects"
      className="scroll-mt-24 border-b border-[var(--color-border)]"
    >
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-10 lg:mb-14">
          <div className="lg:col-span-4">
            <p className="text-label text-[var(--color-primary-glow)]">
              {dict.projects.eyebrow}
            </p>
            <h2 className="text-headline mt-5">{dict.projects.title}</h2>
          </div>
          <div className="lg:col-span-6 lg:col-start-7 self-end">
            <p className="text-body max-w-md">{dict.projects.body}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          {PROJECTS.map((project) => {
            const meta = dict.projects.items[project.key];
            const isExternal = project.href.startsWith("http");
            return (
              <Panel
                key={project.id}
                innerClassName="p-6 lg:p-8 h-full flex flex-col"
                corners
                hover
              >
                <div className="flex items-start justify-between mb-6">
                  <span className="text-mono text-[var(--color-text-faint)]">
                    {project.id}
                  </span>
                  <span className="text-label-sm text-[var(--color-primary-glow)]">
                    {meta.badge}
                  </span>
                </div>
                <h3 className="text-headline mb-3">{meta.title}</h3>
                {meta.accolade && (
                  <div className="mb-3 inline-flex items-center gap-2 border border-[var(--color-primary-glow)]/40 px-2.5 py-1 max-w-fit">
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"
                      aria-hidden="true"
                      className="text-[var(--color-primary-glow)]"
                    >
                      <path d="M17.5 13.5c-.02-2.4 1.96-3.55 2.05-3.6-1.12-1.64-2.86-1.86-3.48-1.89-1.48-.15-2.89.87-3.64.87-.76 0-1.92-.85-3.16-.83-1.62.02-3.12.94-3.95 2.4-1.69 2.93-.43 7.27 1.21 9.65.81 1.16 1.77 2.46 3.04 2.41 1.22-.05 1.68-.79 3.16-.79 1.47 0 1.89.79 3.18.77 1.31-.02 2.14-1.18 2.94-2.34.93-1.34 1.31-2.65 1.33-2.72-.03-.01-2.55-.98-2.58-3.93zM15.05 6.45c.66-.81 1.11-1.93.99-3.05-.96.04-2.13.64-2.82 1.45-.62.71-1.16 1.86-1.02 2.95 1.07.08 2.18-.55 2.85-1.35z" />
                    </svg>
                    <span className="text-label-sm text-[var(--color-primary-glow)]">
                      {meta.accolade}
                    </span>
                  </div>
                )}
                <p className="text-body max-w-md mb-8 flex-1">
                  {meta.description}
                </p>
                <div className="border-t border-[var(--color-border)] pt-5">
                  <div className="mb-5">
                    <p className="text-label-sm text-[var(--color-text-faint)]">
                      {dict.projects.stack}
                    </p>
                    <p className="text-[var(--color-text)] mt-1.5 normal-case tracking-normal font-[300] text-[13px]">
                      {project.stack}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
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
                      className="cta-fill inline-flex items-center gap-2 text-label-sm text-[var(--color-text)] border border-[var(--color-border-strong)] px-4 py-2 whitespace-nowrap hover:border-[var(--color-primary)]"
                    >
                      <span>{dict.projects.visit}</span>
                      <span>{isExternal ? "↗" : "→"}</span>
                    </Link>
                    {project.caseStudy && (
                      <Link
                        href={localizePath(locale, project.caseStudy)}
                        className="cta-fill inline-flex items-center gap-2 text-label-sm text-[var(--color-primary-glow)] border border-[var(--color-primary-glow)]/40 px-4 py-2 whitespace-nowrap hover:border-[var(--color-primary)]"
                      >
                        <span>{dict.projects.caseStudy}</span>
                        <span>→</span>
                      </Link>
                    )}
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      </div>
    </section>
  );
}
