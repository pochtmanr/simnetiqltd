import type { Metadata } from "next";
import Link from "next/link";
import { Panel, Rail, SpecRow } from "@/components/panel";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Active deployments. Precision software instruments developed for global scale.",
};

const projectsList = [
  {
    id: "01",
    title: "Physics.explained",
    badge: "EDUCATION · OPEN",
    description:
      "Physics taught visually. Interactive animations driven by accurate solvers — unit-tested ODE integrators, Newton-Raphson root finders — with a dictionary of 113+ concepts and profiles of 53+ physicists. Free, open-source, and built to expand across electromagnetism, thermodynamics, relativity, quantum, and modern physics.",
    tags: ["NEXT.JS", "WEBGL", "MATHJAX", "ODEX"],
    link: { label: "Visit site", href: "https://physics.it.com/" },
    meta: [
      { label: "Deployed", value: "2026" },
      { label: "Branches", value: "1 live · 5 coming" },
      { label: "License", value: "Open source" },
    ],
  },
  {
    id: "02",
    title: "Doppler VPN",
    badge: "VPN · ENC",
    description:
      "Military-grade network obfuscation using a custom VLESS-Reality implementation. Zero-log architecture with geo-distributed nodes across multiple regions. Built for privacy-first users who demand uncompromising security.",
    tags: ["SWIFT", "KOTLIN", "GO", "MARZBAN"],
    link: { label: "Visit site", href: "https://dopplervpn.org" },
    meta: [
      { label: "Deployed", value: "2025" },
      { label: "Regions", value: "EU · US · APAC" },
      { label: "Protocol", value: "VLESS · Reality" },
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
    title: "ISR Shipping",
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

      {/* Project cards — each as split (content left, specs right), whole card clickable */}
      <section>
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12 lg:py-20 space-y-8 lg:space-y-10">
          {projectsList.map((project) => {
            const isExternal = project.link.href.startsWith("http");
            return (
              <Link
                key={project.id}
                href={project.link.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="block group"
              >
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
                      <h2 className="text-headline mb-5 group-hover:text-[var(--color-primary-glow)] transition-colors">
                        {project.title}
                      </h2>
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
                      <span className="btn-primary group-hover:bg-[var(--color-primary-dim)] group-hover:border-[var(--color-primary-dim)]">
                        {project.link.label}
                        <span>{isExternal ? "↗" : "→"}</span>
                      </span>
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
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
