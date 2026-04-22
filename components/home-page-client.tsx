"use client";

import Link from "next/link";
import { useState } from "react";
import { HeroVisual } from "@/components/hero-visual";
import { Panel, Rail, SpecRow } from "@/components/panel";

const projects = [
  {
    id: "01",
    title: "Physics.explained",
    badge: "EDUCATION · OPEN",
    href: "https://physics.it.com/",
    description:
      "Physics taught visually. Interactive animations driven by accurate solvers, a dictionary of concepts, and profiles physicists.",
    stack: "Next.js · WebGL · MathJax · odex",
    status: "LIVE",
  },
  {
    id: "02",
    title: "Doppler VPN",
    badge: "VPN · ENC",
    href: "https://dopplervpn.org",
    description:
      "Military-grade network obfuscation using a custom VLESS-Reality implementation. Zero-log architecture, geo-distributed nodes.",
    stack: "Swift · Kotlin · Go · Marzban",
    status: "LIVE",
  },
  {
    id: "03",
    title: "Creator AI",
    badge: "NEURAL · GEN",
    href: "https://www.creatorai.art/en",
    description:
      "Neural content synthesis. Fine-tuned LLMs for technical documentation and multi-language editorial pipelines.",
    stack: "Swift · Kotlin · Python · Supabase",
    status: "LIVE",
  },
  {
    id: "04",
    title: "Go Delivery",
    badge: "LOGISTICS · OPS",
    href: "https://www.isrshipping.com",
    description:
      "Delivery platform with real-time GPS tracking, route optimization, and end-to-end order lifecycle management.",
    stack: "Next.js · Node · PostgreSQL",
    status: "LIVE",
  },
];

const capabilities = [
  {
    code: "C-01",
    title: "Mobile & Desktop",
    text: "Native iOS, Android, macOS, Windows, Linux. SwiftUI, Compose, WinUI 3, .NET, Tauri.",
    href: "/services/mobile-desktop",
  },
  {
    code: "C-02",
    title: "Growth & Marketing",
    text: "Meta, TikTok, and Google ad campaigns wired to AppsFlyer, Adjust, and real in-app attribution.",
    href: "/services/growth-marketing",
  },
  {
    code: "C-03",
    title: "AI Integration",
    text: "LLM pipelines, embeddings, RAG, agentic automation across Anthropic / OpenAI stacks.",
    href: "/services/ai-integration",
  },
  {
    code: "C-04",
    title: "Web & Platforms",
    text: "Next.js, Supabase, Stripe, edge-grade billing and auth pipelines end to end.",
    href: "/services/web-platforms",
  },
];

export function HomePageClient() {
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
      {/* -------------------------------------------------------------- */}
      {/* SPLIT HERO                                                     */}
      {/* -------------------------------------------------------------- */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-8 lg:py-10">
          <Rail
            items={[
              "◆ SIMNETIQ / 00 / INDEX",
              "VISUAL INSTRUMENT · PRECISION STUDIO",
              "EST. 2025 · LONDON",
            ]}
            className="mb-8"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            {/* Immersive panel */}
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
                  <span>FIELD · 01</span>
                  <span>WAVE · RUST · BREATH 4S</span>
                </div>
                <div className="flex items-end justify-between text-mono">
                  <span>LAT 51.5074°</span>
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary-glow)] pulse-dot" />
                    SIGNAL OK
                  </span>
                  <span>LON -0.1278°</span>
                </div>
              </div>
            </Panel>

            {/* Content panel */}
            <div className="order-1 lg:order-2 lg:col-span-5 flex flex-col justify-between gap-8">
              <div>
                <p className="text-label text-[var(--color-primary-glow)]">
                  ◇ Technology Studio / London
                </p>
                <h1 className="text-display mt-6">
                  <span className="block">Simnetiq</span>
                  <span className="block text-[var(--color-text-dim)]">
                    Engineering
                  </span>
                </h1>
                <p className="text-body mt-6 max-w-md">
                  We design and operate high-integrity software for private
                  networks, AI platforms, mobile applications, and logistics
                  systems. Calm surfaces, uncompromising internals.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href="#projects" className="btn-primary">
                    Active Operations →
                  </a>
                  <a href="#contact" className="btn-secondary">
                    Contact Us
                  </a>
                </div>
              </div>

              <Panel innerClassName="p-6">
                <p className="text-label-sm text-[var(--color-text-faint)] mb-4">
                  ▸ Operator Manifest
                </p>
                <SpecRow label="Founded" value="2025" />
                <SpecRow label="HQ" value="London, UK" />
                <SpecRow label="Verticals" value="4 active" />
                <SpecRow label="Status" value={<span className="text-[var(--color-primary-glow)]">Accepting briefs</span>} />
              </Panel>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- */}
      {/* PROJECTS                                                        */}
      {/* -------------------------------------------------------------- */}
      <section id="projects" className="scroll-mt-24 border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-10 lg:mb-14">
            <div className="lg:col-span-4">
              <p className="text-label text-[var(--color-primary-glow)]">
                ◇ Selected / Operations
              </p>
              <h2 className="text-headline mt-5">Active deployments</h2>
            </div>
            <div className="lg:col-span-6 lg:col-start-7 self-end">
              <p className="text-body max-w-md">
                Four production systems currently online. Each built with an
                engineering-first philosophy: reliability, architectural purity,
                no filler.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
            {projects.map((project) => {
              const isExternal = project.href.startsWith("http");
              return (
                <Link
                  key={project.id}
                  href={project.href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  className="block group"
                >
                  <Panel innerClassName="p-6 lg:p-8 h-full flex flex-col" corners>
                    <div className="flex items-start justify-between mb-6">
                      <span className="text-mono text-[var(--color-text-faint)]">
                        {project.id}
                      </span>
                      <span className="text-label-sm text-[var(--color-primary-glow)]">
                        {project.badge}
                      </span>
                    </div>
                    <h3 className="text-headline mb-3 group-hover:text-[var(--color-primary-glow)] transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-body max-w-md mb-8 flex-1">
                      {project.description}
                    </p>
                    <div className="border-t border-[var(--color-border)] pt-5 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-label-sm text-[var(--color-text-faint)]">
                          Stack
                        </p>
                        <p className="text-[var(--color-text)] mt-1.5 normal-case tracking-normal font-[300] text-[13px]">
                          {project.stack}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-2 text-label-sm text-[var(--color-text)] border border-[var(--color-border-strong)] px-4 py-2 whitespace-nowrap group-hover:border-[var(--color-primary-glow)] group-hover:text-[var(--color-primary-glow)] group-hover:bg-[var(--color-primary)]/10 transition-colors">
                        Visit
                        <span className="text-[var(--color-primary-glow)]">
                          {isExternal ? "↗" : "→"}
                        </span>
                      </span>
                    </div>
                  </Panel>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- */}
      {/* CAPABILITIES                                                   */}
      {/* -------------------------------------------------------------- */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <p className="text-label text-[var(--color-primary-glow)]">
                ◇ Methodology
              </p>
              <h2 className="text-headline mt-5">Core capabilities</h2>
              <p className="text-body mt-6 max-w-sm">
                Engineering-led. Each vertical is owned by a senior practitioner,
                shipping production systems — not prototypes.
              </p>
            </div>
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {capabilities.map((cap) => (
                <Link
                  key={cap.code}
                  href={cap.href}
                  className="group block h-full"
                >
                  <Panel innerClassName="p-6 h-full">
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-mono text-[var(--color-text-faint)]">
                        {cap.code}
                      </span>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary-glow)]" />
                    </div>
                    <h3 className="text-title mb-3">{cap.title}</h3>
                    <p className="text-body mb-6">{cap.text}</p>
                    <span className="text-label-sm text-[var(--color-text-dim)] group-hover:text-[var(--color-primary-glow)] transition-colors">
                      View service →
                    </span>
                  </Panel>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- */}
      {/* CONTACT                                                        */}
      {/* -------------------------------------------------------------- */}
      <section id="contact" className="scroll-mt-24">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
            <div className="lg:col-span-5">
              <p className="text-label text-[var(--color-primary-glow)]">
                ◇ Transmission
              </p>
              <h2 className="text-headline mt-5">Open a channel</h2>
              <p className="text-body mt-6 max-w-sm">
                Briefs, partnerships, engineering contracts. We respond inside
                one working day.
              </p>
              <div className="mt-10">
                <Panel innerClassName="p-6">
                  <p className="text-label-sm text-[var(--color-text-faint)] mb-4">
                    ▸ Direct
                  </p>
                  <SpecRow label="Email" value="support@simnetiq.store" />
                  <SpecRow label="Location" value="London, UK · BST" />
                  <SpecRow label="Response" value="< 24h weekdays" />
                </Panel>
              </div>
            </div>
            <div className="lg:col-span-7">
              <Panel innerClassName="p-6 lg:p-10" corners>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="text-label-sm text-[var(--color-text-faint)] block mb-2">
                      ▸ Name
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="w-full bg-transparent border-b border-[var(--color-border-strong)] px-0 py-3 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-glow)] transition-colors"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="text-label-sm text-[var(--color-text-faint)] block mb-2">
                      ▸ Email
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className="w-full bg-transparent border-b border-[var(--color-border-strong)] px-0 py-3 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-glow)] transition-colors"
                      placeholder="you@domain.com"
                    />
                  </div>
                  <div>
                    <label className="text-label-sm text-[var(--color-text-faint)] block mb-2">
                      ▸ Message
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) =>
                        setForm({ ...form, message: e.target.value })
                      }
                      className="w-full bg-transparent border-b border-[var(--color-border-strong)] px-0 py-3 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-glow)] transition-colors resize-none"
                      placeholder="Outline the objective"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-mono text-[var(--color-text-faint)]">
                      {status === "sent"
                        ? "TRANSMITTED"
                        : status === "error"
                        ? "FAILED · RETRY"
                        : "CH · 01 READY"}
                    </div>
                    <button
                      type="submit"
                      disabled={status === "sending"}
                      className="btn-primary"
                    >
                      {status === "sending" ? "SENDING…" : "EXECUTE →"}
                    </button>
                  </div>
                  {status === "sent" && (
                    <p className="text-label-sm text-[var(--color-primary-glow)]">
                      ▸ Message transmitted. Expect response within one working
                      day.
                    </p>
                  )}
                  {status === "error" && (
                    <p className="text-label-sm text-[var(--color-error)]">
                      ▸ Transmission failed. Retry or email support@simnetiq.store.
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
