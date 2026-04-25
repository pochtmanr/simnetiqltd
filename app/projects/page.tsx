import type { Metadata } from "next";
import Link from "next/link";
import { Panel, Rail, SpecRow } from "@/components/panel";
import {
  BreadcrumbSchema,
  PortfolioSchema,
} from "@/components/structured-data";

const SITE_URL = "https://simnetiq.store";

export const metadata: Metadata = {
  title: "Projects — Simnetiq Deployments",
  description:
    "Simnetiq production deployments: Doppler VPN (VLESS-Reality, iOS/Android), Creator AI (LLM content platform on Anthropic and OpenAI), Physics.explained (open-source interactive physics), and Go Delivery / ISR Shipping (GPS-tracked logistics platform). Portfolio, case studies, and live apps from the London studio.",
  keywords: [
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
  ],
  alternates: {
    canonical: `${SITE_URL}/projects`,
  },
  openGraph: {
    title: "Projects — Simnetiq Deployments",
    description:
      "Production deployments from Simnetiq: Doppler VPN, Creator AI, Physics.explained, Go Delivery. Live apps, case studies, and portfolio.",
    url: `${SITE_URL}/projects`,
    siteName: "Simnetiq",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Projects — Simnetiq Deployments",
    description:
      "Production deployments from Simnetiq: Doppler VPN, Creator AI, Physics.explained, Go Delivery.",
  },
};

type ProjectEntry = {
  id: string;
  title: string;
  badge: string;
  description: string;
  tags: string[];
  link: { label: string; href: string };
  secondaryLink?: { label: string; href: string };
  meta: { label: string; value: string }[];
};

const projectsList: ProjectEntry[] = [
  {
    id: "01",
    title: "Physics.explained",
    badge: "EDUCATION · OPEN",
    description:
      "An open-source, interactive physics encyclopedia. Every diagram is a live simulation driven by unit-tested ODE integrators and Newton–Raphson solvers. A context-aware AI tutor at /ask answers physics questions with derivations grounded in the library. Classical mechanics, electromagnetism, thermodynamics, relativity, quantum, and modern physics — all shipped, all free.",
    tags: ["NEXT.JS", "WEBGL", "MATHJAX", "AI"],
    link: { label: "Read case study", href: "/projects/physics-explained" },
    secondaryLink: { label: "Visit site", href: "https://physics.it.com/" },
    meta: [
      { label: "Deployed", value: "2026" },
      { label: "Coverage", value: "Six branches · Live" },
      { label: "AI Tutor", value: "/ask · Live" },
    ],
  },
  {
    id: "02",
    title: "Doppler VPN",
    badge: "VPN · ENC",
    description:
      "A censorship-resistant VPN built on VLESS-Reality. Every connection looks like ordinary HTTPS — undetectable by deep packet inspection, resistant to TSPU and active probing. No registration, no logs, no account database. Native apps on iOS, Android, macOS, and Windows, self-hosted control plane, pay by card or crypto.",
    tags: ["SWIFT", "KOTLIN", "GO", "MARZBAN"],
    link: { label: "Read case study", href: "/projects/doppler-vpn" },
    secondaryLink: { label: "Visit site", href: "https://dopplervpn.org" },
    meta: [
      { label: "Deployed", value: "2025" },
      { label: "Protocol", value: "VLESS · Reality" },
      { label: "Platforms", value: "iOS · Android · macOS · Win" },
    ],
  },
  {
    id: "03",
    title: "Creator AI",
    badge: "NEURAL · GEN",
    description:
      "Neural content synthesis. Fine-tuned LLMs for technical documentation, multi-language editorial pipelines, and automated publishing workflows.",
    tags: ["SWIFT", "KOTLIN", "PYTHON", "SUPABASE"],
    link: { label: "Visit site", href: "https://www.creatorai.art/en" },
    meta: [
      { label: "Deployed", value: "2025" },
      { label: "Models", value: "Anthropic · OpenAI" },
      { label: "Platforms", value: "iOS · Android · Web" },
    ],
  },
  {
    id: "04",
    title: "Go Delivery",
    badge: "LOGISTICS · OPS",
    description:
      "Delivery management platform with real-time GPS driver tracking, route optimization, and order lifecycle management. Built for the Israeli logistics market with multi-language support.",
    tags: ["NEXT.JS", "REACT", "NODE", "POSTGRES"],
    link: { label: "Visit site", href: "https://www.isrshipping.com" },
    meta: [
      { label: "Deployed", value: "2025" },
      { label: "Market", value: "IL · Domestic" },
      { label: "Scope", value: "Dispatch · Fleet · Ops" },
    ],
  },
];

export default function ProjectsPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: `${SITE_URL}/` },
          { name: "Projects", url: `${SITE_URL}/projects` },
        ]}
      />
      <PortfolioSchema
        items={projectsList.map((p) => ({
          name: p.title,
          url: p.link.href,
          description: p.description,
        }))}
      />
      {/* Hero */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 pt-12 lg:pt-20 pb-16 lg:pb-24">
          <Rail
            items={[
              "◆ SIMNETIQ / 01 / PROJECTS",
              "ENGINEERING ARCHIVE",
              "ACTIVE ENTRIES · 04",
            ]}
            className="mb-10"
          />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <p className="text-label text-[var(--color-primary-glow)]">
                ◇ Engineering Archive
              </p>
              <h1 className="text-display mt-6">
                <span className="block">Active</span>
                <span className="block text-[var(--color-text-dim)]">
                  Deployments
                </span>
              </h1>
            </div>
            <div className="lg:col-span-5 self-end">
              <p className="text-body max-w-md">
                A catalog of precision software instruments developed for global
                scale. Industrial-grade reliability, minimalist interfaces,
                engineering-first execution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Project cards — each as split (content left, specs right) with explicit CTAs */}
      <section>
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12 lg:py-20 space-y-8 lg:space-y-10">
          {projectsList.map((project) => {
            const primaryExternal = project.link.href.startsWith("http");
            const secondary = project.secondaryLink;
            const secondaryExternal =
              !!secondary && secondary.href.startsWith("http");
            return (
              <article key={project.id} className="group">
                <Panel innerClassName="p-6 lg:p-10" corners>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Left: copy + tags */}
                    <div className="lg:col-span-7">
                      <div className="flex items-center justify-between mb-8">
                        <span className="text-mono text-[var(--color-text-faint)]">
                          {project.id} · ENTRY
                        </span>
                        <span className="text-label-sm text-[var(--color-primary-glow)]">
                          {project.badge}
                        </span>
                      </div>
                      <h2 className="text-headline mb-5">{project.title}</h2>
                      <p className="text-body mb-8 max-w-lg">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-8">
                        {project.tags.map((tag) => (
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
                          href={project.link.href}
                          target={primaryExternal ? "_blank" : undefined}
                          rel={
                            primaryExternal
                              ? "noopener noreferrer"
                              : undefined
                          }
                          className="btn-primary"
                        >
                          {project.link.label}
                          <span>{primaryExternal ? "↗" : "→"}</span>
                        </Link>
                        {secondary && (
                          <Link
                            href={secondary.href}
                            target={secondaryExternal ? "_blank" : undefined}
                            rel={
                              secondaryExternal
                                ? "noopener noreferrer"
                                : undefined
                            }
                            className="btn-secondary"
                          >
                            {secondary.label}
                            <span>{secondaryExternal ? "↗" : "→"}</span>
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Right: specs panel */}
                    <div className="lg:col-span-5">
                      <div className="border-l border-[var(--color-border)] lg:pl-10">
                        <p className="text-label-sm text-[var(--color-text-faint)] mb-4">
                          ▸ Specification
                        </p>
                        {project.meta.map((m) => (
                          <SpecRow
                            key={m.label}
                            label={m.label}
                            value={m.value}
                          />
                        ))}
                        <div className="mt-6 flex items-center gap-2">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary-glow)] pulse-dot" />
                          <span className="text-mono text-[var(--color-primary-glow)]">
                            Live · Nominal
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
