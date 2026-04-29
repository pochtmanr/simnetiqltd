"use client";

import Link from "next/link";
import { useState } from "react";
import { HeroVisual } from "@/components/hero-visual";
import { Panel, Rail, SpecRow } from "@/components/panel";
import { localizePath, type Locale } from "@/lib/i18n";

type HomeDict = {
  hero: {
    rail: { index: string; tagline: string; established: string };
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    body: string;
    ctaPrimary: string;
    ctaSecondary: string;
    manifest: {
      label: string;
      founded: string;
      founded_value: string;
      hq: string;
      hq_value: string;
      verticals: string;
      verticals_value: string;
      status: string;
      status_value: string;
    };
    accolade: { label: string; value: string };
    field: { label: string; wave: string; signal: string };
  };
  projects: {
    eyebrow: string;
    title: string;
    body: string;
    stack: string;
    visit: string;
    caseStudy: string;
    items: Record<
      "physics" | "doppler" | "creator" | "delivery",
      { title: string; badge: string; description: string; accolade?: string }
    >;
  };
  capabilities: {
    eyebrow: string;
    title: string;
    body: string;
    viewService: string;
    items: Record<
      "mobile" | "growth" | "ai" | "web",
      { title: string; text: string }
    >;
  };
  contact: {
    eyebrow: string;
    title: string;
    body: string;
    directLabel: string;
    email: string;
    location: string;
    location_value: string;
    response: string;
    response_value: string;
    name: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    message: string;
    messagePlaceholder: string;
    ready: string;
    sending: string;
    submit: string;
    transmitted: string;
    failed: string;
    successMessage: string;
    errorMessage: string;
  };
};

type ProjectKey = "physics" | "doppler" | "creator" | "delivery";

type ProjectDef = {
  key: ProjectKey;
  id: string;
  href: string;
  caseStudy?: string;
  stack: string;
};

const projects: ProjectDef[] = [
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

type CapKey = "mobile" | "growth" | "ai" | "web";

const capabilities: { key: CapKey; code: string; href: string }[] = [
  { key: "mobile", code: "C-01", href: "/services/mobile-desktop" },
  { key: "growth", code: "C-02", href: "/services/growth-marketing" },
  { key: "ai", code: "C-03", href: "/services/ai-integration" },
  { key: "web", code: "C-04", href: "/services/web-platforms" },
];

export function HomePageClient({
  locale,
  dict,
}: {
  locale: Locale;
  dict: HomeDict;
}) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("sent");
        setForm({ name: "", email: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      {/* SPLIT HERO */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-8 lg:py-10">
          <Rail
            items={[
              dict.hero.rail.index,
              dict.hero.rail.tagline,
              dict.hero.rail.established,
            ]}
            className="mb-8"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            <Panel
              className="order-2 lg:order-1 lg:col-span-7 min-h-[460px] lg:min-h-[620px]"
              innerClassName="h-full"
              corners
            >
              <div className="absolute inset-0">
                <HeroVisual />
              </div>
              <div className="relative z-10 flex flex-col justify-between h-full p-6 lg:p-10">
                <div className="flex items-start justify-between text-mono">
                  <span>{dict.hero.field.label}</span>
                  <span>{dict.hero.field.wave}</span>
                </div>
                <div className="flex items-end justify-between text-mono">
                  <span>LAT 51.5074°</span>
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary-glow)] pulse-dot" />
                    {dict.hero.field.signal}
                  </span>
                  <span>LON -0.1278°</span>
                </div>
              </div>
            </Panel>

            <div className="order-1 lg:order-2 lg:col-span-5 flex flex-col justify-between gap-8">
              <div>
                <p className="text-label text-[var(--color-primary-glow)]">
                  {dict.hero.eyebrow}
                </p>
                <h1 className="text-display mt-6">
                  <span className="block">{dict.hero.titleLine1}</span>
                  <span className="block text-[var(--color-text-dim)]">
                    {dict.hero.titleLine2}
                  </span>
                </h1>
                <p className="text-body mt-6 max-w-md">{dict.hero.body}</p>

                {/* App Store accolade — Top 30 Israel developers */}
                <div className="mt-7 inline-flex items-center gap-3 border border-[var(--color-border-strong)] px-3.5 py-2.5 max-w-fit">
                  <span
                    aria-hidden="true"
                    className="inline-flex w-5 h-5 items-center justify-center text-[var(--color-primary-glow)]"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                      <path d="M17.5 13.5c-.02-2.4 1.96-3.55 2.05-3.6-1.12-1.64-2.86-1.86-3.48-1.89-1.48-.15-2.89.87-3.64.87-.76 0-1.92-.85-3.16-.83-1.62.02-3.12.94-3.95 2.4-1.69 2.93-.43 7.27 1.21 9.65.81 1.16 1.77 2.46 3.04 2.41 1.22-.05 1.68-.79 3.16-.79 1.47 0 1.89.79 3.18.77 1.31-.02 2.14-1.18 2.94-2.34.93-1.34 1.31-2.65 1.33-2.72-.03-.01-2.55-.98-2.58-3.93zM15.05 6.45c.66-.81 1.11-1.93.99-3.05-.96.04-2.13.64-2.82 1.45-.62.71-1.16 1.86-1.02 2.95 1.07.08 2.18-.55 2.85-1.35z" />
                    </svg>
                  </span>
                  <div className="flex flex-col leading-tight">
                   
                    <span className="text-body-strong text-[var(--color-text)]">
                      {dict.hero.accolade.value}
                    </span>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={localizePath(locale, "/projects")}
                    className="btn-primary btn-tracer"
                  >
                    {dict.hero.ctaPrimary}
                    <span aria-hidden="true" className="btn-arrow">
                      →
                    </span>
                  </Link>
                  <a href="#contact" className="btn-secondary btn-tracer">
                    {dict.hero.ctaSecondary}
                    <span aria-hidden="true" className="btn-arrow">
                      →
                    </span>
                  </a>
                </div>
              </div>

              <Panel innerClassName="p-6">
                <p className="text-label-sm text-[var(--color-text-faint)] mb-4">
                  {dict.hero.manifest.label}
                </p>
                <SpecRow
                  label={dict.hero.manifest.founded}
                  value={dict.hero.manifest.founded_value}
                />
                <SpecRow
                  label={dict.hero.manifest.hq}
                  value={dict.hero.manifest.hq_value}
                />
                <SpecRow
                  label={dict.hero.manifest.verticals}
                  value={dict.hero.manifest.verticals_value}
                />
                <SpecRow
                  label={dict.hero.manifest.status}
                  value={
                    <span className="text-[var(--color-primary-glow)]">
                      {dict.hero.manifest.status_value}
                    </span>
                  }
                />
              </Panel>
            </div>
          </div>
        </div>
      </section>

      {/* PROJECTS */}
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
            {projects.map((project) => {
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
                        className="inline-flex items-center gap-2 text-label-sm text-[var(--color-text)] border border-[var(--color-border-strong)] px-4 py-2 whitespace-nowrap hover:border-[var(--color-primary-glow)] hover:text-[var(--color-primary-glow)] hover:bg-[var(--color-primary)]/10 transition-colors"
                      >
                        {dict.projects.visit}
                        <span className="text-[var(--color-primary-glow)]">
                          {isExternal ? "↗" : "→"}
                        </span>
                      </Link>
                      {project.caseStudy && (
                        <Link
                          href={localizePath(locale, project.caseStudy)}
                          className="inline-flex items-center gap-2 text-label-sm text-[var(--color-primary-glow)] border border-[var(--color-primary-glow)]/40 px-4 py-2 whitespace-nowrap hover:border-[var(--color-primary-glow)] hover:bg-[var(--color-primary)]/10 transition-colors"
                        >
                          {dict.projects.caseStudy}
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

      {/* CAPABILITIES */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <p className="text-label text-[var(--color-primary-glow)]">
                {dict.capabilities.eyebrow}
              </p>
              <h2 className="text-headline mt-5">{dict.capabilities.title}</h2>
              <p className="text-body mt-6 max-w-sm">
                {dict.capabilities.body}
              </p>
            </div>
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {capabilities.map((cap) => {
                const meta = dict.capabilities.items[cap.key];
                return (
                  <Link
                    key={cap.code}
                    href={localizePath(locale, cap.href)}
                    className="group block h-full"
                  >
                    <Panel innerClassName="p-6 h-full">
                      <div className="flex items-center justify-between mb-5">
                        <span className="text-mono text-[var(--color-text-faint)]">
                          {cap.code}
                        </span>
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary-glow)]" />
                      </div>
                      <h3 className="text-title mb-3">{meta.title}</h3>
                      <p className="text-body mb-6">{meta.text}</p>
                      <span className="text-label-sm text-[var(--color-text-dim)] group-hover:text-[var(--color-primary-glow)] transition-colors">
                        {dict.capabilities.viewService}
                      </span>
                    </Panel>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="scroll-mt-24">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
            <div className="lg:col-span-5">
              <p className="text-label text-[var(--color-primary-glow)]">
                {dict.contact.eyebrow}
              </p>
              <h2 className="text-headline mt-5">{dict.contact.title}</h2>
              <p className="text-body mt-6 max-w-sm">{dict.contact.body}</p>
              <div className="mt-10">
                <Panel innerClassName="p-6">
                  <p className="text-label-sm text-[var(--color-text-faint)] mb-4">
                    {dict.contact.directLabel}
                  </p>
                  <SpecRow
                    label={dict.contact.email}
                    value="support@simnetiq.store"
                  />
                  <SpecRow
                    label={dict.contact.location}
                    value={dict.contact.location_value}
                  />
                  <SpecRow
                    label={dict.contact.response}
                    value={dict.contact.response_value}
                  />
                </Panel>
              </div>
            </div>
            <div className="lg:col-span-7">
              <Panel innerClassName="p-6 lg:p-10" corners>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="text-label-sm text-[var(--color-text-faint)] block mb-2">
                      {dict.contact.name}
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="w-full bg-transparent border-b border-[var(--color-border-strong)] px-0 py-3 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-glow)] transition-colors"
                      placeholder={dict.contact.namePlaceholder}
                    />
                  </div>
                  <div>
                    <label className="text-label-sm text-[var(--color-text-faint)] block mb-2">
                      {dict.contact.emailLabel}
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className="w-full bg-transparent border-b border-[var(--color-border-strong)] px-0 py-3 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-glow)] transition-colors"
                      placeholder={dict.contact.emailPlaceholder}
                    />
                  </div>
                  <div>
                    <label className="text-label-sm text-[var(--color-text-faint)] block mb-2">
                      {dict.contact.message}
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) =>
                        setForm({ ...form, message: e.target.value })
                      }
                      className="w-full bg-transparent border-b border-[var(--color-border-strong)] px-0 py-3 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-glow)] transition-colors resize-none"
                      placeholder={dict.contact.messagePlaceholder}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-mono text-[var(--color-text-faint)]">
                      {status === "sent"
                        ? dict.contact.transmitted
                        : status === "error"
                        ? dict.contact.failed
                        : dict.contact.ready}
                    </div>
                    <button
                      type="submit"
                      disabled={status === "sending"}
                      className="btn-primary"
                    >
                      {status === "sending"
                        ? dict.contact.sending
                        : dict.contact.submit}
                      {status !== "sending" && <span aria-hidden="true">→</span>}
                    </button>
                  </div>
                  {status === "sent" && (
                    <p className="text-label-sm text-[var(--color-primary-glow)]">
                      {dict.contact.successMessage}
                    </p>
                  )}
                  {status === "error" && (
                    <p className="text-label-sm text-[var(--color-error)]">
                      {dict.contact.errorMessage}
                    </p>
                  )}
                </form>
              </Panel>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
