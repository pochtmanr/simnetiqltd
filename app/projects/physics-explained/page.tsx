import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Panel, Rail, SpecRow } from "@/components/panel";
import { BreadcrumbSchema } from "@/components/structured-data";

const SITE_URL = "https://simnetiq.store";

export const metadata: Metadata = {
  title: "Physics.explained — Case Study",
  description:
    "Physics.explained is an open-source interactive physics encyclopedia built by Simnetiq. A live encyclopedia spanning classical mechanics, electromagnetism, thermodynamics, relativity, quantum and modern physics — powered by unit-tested ODE solvers, WebGL visualisations, a cross-linked concept graph, and an AI tutor at /ask that answers questions with derivations grounded in the library.",
  alternates: { canonical: `${SITE_URL}/projects/physics-explained` },
  openGraph: {
    title: "Physics.explained — Case Study",
    description:
      "Open-source, interactive physics education. Live simulations, cross-linked concept graph, and a context-aware AI tutor at /ask.",
    url: `${SITE_URL}/projects/physics-explained`,
    siteName: "Simnetiq",
    type: "article",
    locale: "en_GB",
    images: [{ url: "/physics-header.avif", alt: "Physics.explained — hero visual" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Physics.explained — Case Study",
    description:
      "Open-source, interactive physics education built on accurate solvers, WebGL, and an AI tutor.",
    images: ["/physics-header.avif"],
  },
};

// Physics.explained product design — referenced on this Simnetiq page as case-study content.
const product = {
  palette: [
    { name: "Ink", hex: "#07090E", role: "Background", onDark: true },
    { name: "Bone", hex: "#EEF2F9", role: "Foreground" },
    { name: "Cyan", hex: "#6FB8C6", role: "Primary" },
    { name: "Magenta", hex: "#FF6ADE", role: "Accent" },
    { name: "Amber", hex: "#F5C451", role: "Accent" },
    { name: "Mint", hex: "#5BFFAE", role: "Accent" },
    { name: "Slate", hex: "#2A3448", role: "Border", onDark: true },
  ],
};

const specs = [
  { label: "Status", value: "Launched · Live" },
  { label: "Deployed", value: "2026" },
  { label: "License", value: "Open source" },
  { label: "Stack", value: "Next.js · WebGL · MathJax" },
  { label: "Solvers", value: "ODEX · Newton–Raphson" },
  { label: "AI Tutor", value: "/ask · Live" },
  { label: "Coverage", value: "Six branches · Live" },
];

const insideItems = [
  {
    figure: "/ask",
    label: "AI tutor",
    body: "Ask any physics question and get a derivation, a diagram, and cross-links back to the encyclopedia. The tutor is grounded in the same concept graph that drives the simulations, so answers stay inside the library.",
  },
  {
    figure: "ODE",
    label: "Simulations",
    body: "Every diagram is a live simulation. Unit-tested ordinary differential equation integrators run in the browser — drag initial conditions, nudge parameters, watch the physics respond.",
  },
  {
    figure: "DICT",
    label: "Concept graph",
    body: "A searchable, cross-linked encyclopedia of physics concepts — first principles through modern formulations — each entry bound to the simulations that demonstrate it and the physicists who shaped it.",
  },
  {
    figure: "BIO",
    label: "Physicist profiles",
    body: "Biographical dossiers for the scientists behind every result, wired into the concept graph so derivations, diagrams, and history sit one click apart.",
  },
];

const branches = [
  { id: "01", name: "Classical Mechanics" },
  { id: "02", name: "Electromagnetism" },
  { id: "03", name: "Thermodynamics" },
  { id: "04", name: "Relativity" },
  { id: "05", name: "Quantum Mechanics" },
  { id: "06", name: "Modern Physics" },
];

export default function PhysicsExplainedPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: `${SITE_URL}/` },
          { name: "Projects", url: `${SITE_URL}/projects` },
          {
            name: "Physics.explained",
            url: `${SITE_URL}/projects/physics-explained`,
          },
        ]}
      />

      {/* Hero */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 pt-12 lg:pt-20 pb-16 lg:pb-24">
          <Rail
            items={[
              "◆ SIMNETIQ / 01 / PROJECTS / PHYSICS.EXPLAINED",
              "CASE STUDY",
              "CLASSICAL MECHANICS · LIVE",
            ]}
            className="mb-10"
          />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <p className="text-label text-[var(--color-primary-glow)]">
                ◇ Education · Open · Interactive
              </p>
              <h1 className="text-display mt-6">
                <span className="block">Physics,</span>
                <span className="block text-[var(--color-text-dim)]">
                  taught visually.
                </span>
              </h1>
            </div>
            <div className="lg:col-span-5 self-end">
              <p className="text-body max-w-md">
                Physics.explained is an open-source, interactive physics
                encyclopedia. Live simulations, a cross-linked concept graph,
                physicist profiles, and an AI tutor at{" "}
                <span className="text-body-strong">/ask</span> — all six
                branches of physics under one roof, all shipped.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="https://physics.it.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  Visit site
                  <span>↗</span>
                </Link>
                <Link
                  href="https://physics.it.com/ask"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  Try /ask
                  <span>↗</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Header image + specs */}
      <section>
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            <div className="lg:col-span-8">
              <Panel innerClassName="p-2" corners>
                <div className="relative w-full overflow-hidden aspect-[16/9]">
                  <Image
                    src="/physics-header.avif"
                    alt="Physics.explained — interactive visualisation of classical mechanics"
                    fill
                    priority
                    sizes="(min-width: 1440px) 896px, (min-width: 1024px) 66vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </Panel>
              <div className="mt-4 text-mono text-[var(--color-text-faint)]">
                Fig. 01 · Interactive mechanics visualisation
              </div>
            </div>

            <div className="lg:col-span-4">
              <Panel innerClassName="p-6 lg:p-8" corners>
                <p className="text-label-sm text-[var(--color-text-faint)] mb-4">
                  ▸ Specification
                </p>
                {specs.map((row) => (
                  <SpecRow key={row.label} label={row.label} value={row.value} />
                ))}
                <div className="mt-6 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary-glow)] pulse-dot" />
                  <span className="text-mono text-[var(--color-primary-glow)]">
                    Live · Nominal
                  </span>
                </div>
              </Panel>
            </div>
          </div>
        </div>
      </section>

      {/* About — long-form */}
      <section id="about" className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <p className="text-mono text-[var(--color-primary-glow)] mb-6">
                § 01 · About
              </p>
              <h2 className="text-headline">
                <span className="block">A physics library</span>
                <span className="block text-[var(--color-text-dim)]">
                  that computes.
                </span>
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6 space-y-5">
              <p className="text-body">
                Physics.explained began as a rejection of static textbook
                diagrams. Most physics content on the web is written once,
                rendered flat, and frozen — a pendulum drawn but not swung, an
                orbit shown but not integrated. Students are left memorising
                shapes instead of developing intuition.
              </p>
              <p className="text-body">
                The product treats every diagram as executable physics. Motion
                is computed at runtime by ODE integrators with numerical
                tolerances chosen to stay faithful under perturbation.
                Equilibria are solved by Newton–Raphson root finders. Drag
                initial conditions, nudge parameters, and the simulation
                responds as the equations themselves would.
              </p>
              <p className="text-body">
                Around the solver core sits a dense reference layer: a
                cross-linked concept graph spanning classical mechanics,
                electromagnetism, thermodynamics, relativity, quantum
                mechanics, and modern physics, plus biographical profiles of
                the physicists behind every result. Every concept links back
                to the simulations that demonstrate it and the people who
                shaped it.
              </p>
              <p className="text-body">
                On top of all of that sits{" "}
                <span className="text-body-strong">/ask</span> — an AI tutor
                grounded in the same concept graph. Ask anything from{" "}
                <em>&ldquo;derive Kepler&apos;s third law&rdquo;</em> to{" "}
                <em>
                  &ldquo;why does entropy always increase?&rdquo;
                </em>{" "}
                and get a worked answer with citations back into the library.
                The full encyclopedia, the solver engine, and the tutor are
                free and open source.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* /ask — AI tutor callout */}
      <section className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <Panel innerClassName="p-8 lg:p-14 relative overflow-hidden" corners>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
              <div className="lg:col-span-7">
                <p className="text-mono text-[var(--color-primary-glow)] mb-6">
                  § 02 · physics.it.com/ask
                </p>
                <h2 className="text-headline mb-6">
                  <span className="block">A tutor that&apos;s</span>
                  <span className="block text-[var(--color-text-dim)]">
                    read the whole library.
                  </span>
                </h2>
                <p className="text-body max-w-xl mb-5">
                  <span className="text-body-strong">/ask</span> is an AI
                  tutor wired directly into the concept graph. Ask a question
                  in plain language, get a worked derivation back — with
                  citations to the encyclopedia entries and live simulations
                  that back it up.
                </p>
                <p className="text-body max-w-xl">
                  Because the tutor is grounded in the library, answers stay
                  inside physics — no hallucinated formulas, no drift. Every
                  response links to the concepts it used, so readers can dig
                  deeper the moment a term feels unfamiliar.
                </p>
              </div>
              <div className="lg:col-span-5">
                <div className="border-l border-[var(--color-border)] lg:pl-10">
                  <p className="text-label-sm text-[var(--color-text-faint)] mb-5">
                    ▸ Example prompts
                  </p>
                  <ul className="space-y-3">
                    {[
                      "Derive Kepler's third law from Newtonian gravity.",
                      "Why does entropy always increase?",
                      "Explain the double-slit experiment in 3 sentences.",
                      "Show the Lorentz transform for a boost in x.",
                    ].map((q) => (
                      <li
                        key={q}
                        className="text-body border-l-2 border-[var(--color-primary-glow)] pl-4"
                      >
                        {q}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Link
                      href="https://physics.it.com/ask"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                    >
                      Open /ask
                      <span>↗</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </section>

      {/* What's inside — four cards */}
      <section className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="mb-10">
            <p className="text-mono text-[var(--color-primary-glow)] mb-6">
              § 03 · What&apos;s inside
            </p>
            <h2 className="text-headline">Four moving parts.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {insideItems.map((item, i) => (
              <Panel key={item.label} innerClassName="p-8" corners>
                <div className="flex items-center justify-between mb-8">
                  <span className="text-mono text-[var(--color-text-faint)]">
                    0{i + 1} · ENTRY
                  </span>
                  <span className="text-label-sm text-[var(--color-primary-glow)]">
                    {item.label.toUpperCase()}
                  </span>
                </div>
                <div
                  className="mb-6"
                  style={{
                    fontSize: "clamp(2.25rem, 3.6vw, 3rem)",
                    fontWeight: 500,
                    letterSpacing: "-0.025em",
                    lineHeight: 1,
                    color: "var(--color-text)",
                  }}
                >
                  {item.figure}
                </div>
                <p className="text-body">{item.body}</p>
              </Panel>
            ))}
          </div>
        </div>
      </section>

      {/* Design system reference — Physics.explained palette + typography */}
      <section className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-12">
            <div className="lg:col-span-4">
              <p className="text-mono text-[var(--color-primary-glow)] mb-6">
                § 04 · Design system
              </p>
              <h2 className="text-headline">
                <span className="block">Instrument,</span>
                <span className="block text-[var(--color-text-dim)]">
                  not illustration.
                </span>
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <p className="text-body">
                The visual language borrows from scientific instrumentation:
                near-black ground, bone foreground, and a small set of
                saturated accents that carry meaning — cyan for primary
                actions and states, magenta, amber, and mint for categorical
                signals across simulations.
              </p>
            </div>
          </div>

          {/* Palette swatches */}
          <p className="text-label-sm text-[var(--color-text-faint)] mb-4">
            ▸ Palette
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {product.palette.map((s) => (
              <Panel key={s.hex} innerClassName="p-0 overflow-hidden">
                <div
                  className="relative aspect-[4/3] w-full"
                  style={{ backgroundColor: s.hex }}
                >
                  {s.onDark && (
                    <div
                      aria-hidden
                      className="absolute inset-0 opacity-[0.18]"
                      style={{
                        backgroundImage:
                          "linear-gradient(135deg, rgba(255,255,255,0.4) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.4) 75%, transparent 75%)",
                        backgroundSize: "8px 8px",
                      }}
                    />
                  )}
                </div>
                <div className="p-4">
                  <div className="text-label-sm text-[var(--color-text-faint)]">
                    {s.role}
                  </div>
                  <div className="mt-2 text-title">{s.name}</div>
                  <div className="mt-1 text-mono text-[var(--color-text-muted)]">
                    {s.hex}
                  </div>
                </div>
              </Panel>
            ))}
          </div>

          {/* Typography pairing */}
          <p className="text-label-sm text-[var(--color-text-faint)] mt-12 mb-4">
            ▸ Typography pairing
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Display */}
            <Panel innerClassName="p-8 lg:p-10" corners>
              <div className="text-mono text-[var(--color-primary-glow)] mb-6">
                01 · Display
              </div>
              <div
                style={{
                  fontFamily:
                    "var(--font-display), var(--font-inter), sans-serif",
                  fontSize: "clamp(2.25rem, 3.6vw, 3rem)",
                  fontWeight: 500,
                  letterSpacing: "-0.03em",
                  lineHeight: 0.98,
                  color: "var(--color-text)",
                }}
              >
                Aa Bb 01
              </div>
              <div className="mt-6 text-label-sm text-[var(--color-text-dim)]">
                Space Grotesk — Geometric modular sans
              </div>
              <p className="mt-3 text-body">
                Used for headlines, figures, and swatch names on
                physics.it.com. Stands in for Archive Grotesk / General Sans.
              </p>
            </Panel>

            {/* Body */}
            <Panel innerClassName="p-8 lg:p-10" corners>
              <div className="text-mono text-[var(--color-primary-glow)] mb-6">
                02 · Body
              </div>
              <div
                style={{
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                  fontSize: "clamp(1.375rem, 2vw, 1.75rem)",
                  fontWeight: 400,
                  letterSpacing: "-0.005em",
                  lineHeight: 1.3,
                  color: "var(--color-text)",
                }}
              >
                The quick brown fox integrates over dt.
              </div>
              <div className="mt-6 text-label-sm text-[var(--color-text-dim)]">
                Inter — Neo-grotesque sans
              </div>
              <p className="mt-3 text-body">
                Carries long-form reading at 14–17&nbsp;px. Weights 300, 400,
                500, 700.
              </p>
            </Panel>

            {/* Mono */}
            <Panel innerClassName="p-8 lg:p-10" corners>
              <div className="text-mono text-[var(--color-primary-glow)] mb-6">
                03 · Eyebrow / Mono
              </div>
              <div
                style={{
                  fontFamily:
                    "var(--font-jetbrains), ui-monospace, monospace",
                  fontSize: "clamp(1.0625rem, 1.3vw, 1.25rem)",
                  fontWeight: 400,
                  letterSpacing: "0.04em",
                  lineHeight: 1.4,
                  color: "var(--color-text)",
                }}
              >
                /* dt = 1/60s; solve(...) */
              </div>
              <div className="mt-6 text-label-sm text-[var(--color-text-dim)]">
                JetBrains Mono — Code & labels
              </div>
              <p className="mt-3 text-body">
                Reserved for labels, coordinates, code excerpts, and metadata
                rails.
              </p>
            </Panel>
          </div>
        </div>
      </section>

      {/* Branches — all live */}
      <section className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-8">
            <div className="lg:col-span-4">
              <p className="text-mono text-[var(--color-primary-glow)] mb-6">
                § 05 · Branches
              </p>
              <h2 className="text-headline">
                <span className="block">All six,</span>
                <span className="block text-[var(--color-text-dim)]">
                  all live.
                </span>
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <p className="text-body">
                One solver stack powers every branch — the same numerics that
                integrate a pendulum also run Maxwell&apos;s equations,
                thermal gradients, Lorentz transforms, Schrödinger evolution,
                and the modern-physics capstones. Every branch ships with its
                simulations, its concept entries, and its physicist profiles
                already wired into /ask.
              </p>
            </div>
          </div>

          <Panel innerClassName="p-0" corners>
            <ul>
              {branches.map((b, i) => (
                <li
                  key={b.id}
                  className={`grid grid-cols-12 items-center gap-4 px-6 lg:px-8 py-5 ${
                    i < branches.length - 1
                      ? "border-b border-[var(--color-border)]"
                      : ""
                  }`}
                >
                  <span className="col-span-2 md:col-span-1 text-mono text-[var(--color-text-faint)]">
                    {b.id}
                  </span>
                  <span className="col-span-7 md:col-span-8 text-title">
                    {b.name}
                  </span>
                  <span className="col-span-3 md:col-span-3 flex justify-end items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary-glow)] pulse-dot" />
                    <span className="text-label-sm text-[var(--color-primary-glow)]">
                      LIVE
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <Panel innerClassName="p-8 lg:p-14" corners>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-8">
                <p className="text-mono text-[var(--color-primary-glow)] mb-6">
                  ◇ Continue
                </p>
                <h2 className="text-headline">Open the library.</h2>
                <p className="text-body mt-5 max-w-lg">
                  Every concept, every physicist, every simulation, plus the
                  AI tutor at /ask — all live, all free, all open source.
                </p>
              </div>
              <div className="lg:col-span-4 flex lg:justify-end">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="https://physics.it.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    Visit site
                    <span>↗</span>
                  </Link>
                  <Link
                    href="https://physics.it.com/ask"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    Try /ask
                    <span>↗</span>
                  </Link>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </section>
    </>
  );
}
