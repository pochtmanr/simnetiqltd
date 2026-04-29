import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel, Rail, SpecRow } from "@/components/panel";
import {
  BreadcrumbSchema,
  CaseStudyArticleSchema,
} from "@/components/structured-data";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";
import { buildLocalizedMetadata } from "@/lib/seo-meta";

const SITE_URL = "https://simnetiq.store";

const PHYSICS_KEYWORDS = [
  "Physics.explained",
  "physics.it.com",
  "open source physics encyclopedia",
  "interactive physics simulations",
  "WebGL physics simulator",
  "ODE physics solver",
  "Newton-Raphson solver",
  "AI physics tutor",
  "ask physics AI",
  "classical mechanics simulator",
  "electromagnetism simulator",
  "thermodynamics simulator",
  "quantum mechanics visualisation",
  "relativity visualisation",
  "physics concept graph",
  "physicist biographies open source",
  "Simnetiq case study Physics",
  "physics education software",
  "physics e-learning platform",
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
    routeKey: "caseStudyPhysics",
    path: "/projects/physics-explained",
    keywords: PHYSICS_KEYWORDS,
    ogImage: "/physics-header.avif",
    ogType: "article",
  });
}

// Physics.explained product design — referenced on this Simnetiq page as case-study content.
const productPalette = [
  { name: "Ink", hex: "#07090E", role: "Background", onDark: true },
  { name: "Bone", hex: "#EEF2F9", role: "Foreground" },
  { name: "Cyan", hex: "#6FB8C6", role: "Primary" },
  { name: "Magenta", hex: "#FF6ADE", role: "Accent" },
  { name: "Amber", hex: "#F5C451", role: "Accent" },
  { name: "Mint", hex: "#5BFFAE", role: "Accent" },
  { name: "Slate", hex: "#2A3448", role: "Border", onDark: true },
];

const typographyFontFamilies = [
  "var(--font-display), var(--font-inter), sans-serif",
  "var(--font-inter), system-ui, sans-serif",
  "var(--font-jetbrains), ui-monospace, monospace",
];

type Params = Promise<{ locale: string }>;

export default async function PhysicsExplainedPage({
  params,
}: {
  params: Params;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);
  const c = dict.caseStudyPhysics;

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: `${SITE_URL}/${locale}` },
          { name: "Projects", url: `${SITE_URL}/${locale}/projects` },
          {
            name: "Physics.explained",
            url: `${SITE_URL}/${locale}/projects/physics-explained`,
          },
        ]}
      />
      <CaseStudyArticleSchema
        headline={`${c.titleLine1} ${c.titleLine2}`.trim()}
        path="/projects/physics-explained"
        description={c.body}
        image="/physics-header.avif"
        locale={locale}
        datePublished="2026-01-15"
        dateModified={new Date().toISOString().slice(0, 10)}
        keywords={PHYSICS_KEYWORDS}
      />

      {/* Hero */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 pt-12 lg:pt-20 pb-16 lg:pb-24">
          <Rail
            items={[c.rail.index, c.rail.tag, c.rail.status]}
            className="mb-10"
          />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <p className="text-label text-[var(--color-primary-glow)]">
                {c.eyebrow}
              </p>
              <h1 className="text-display mt-6">
                <span className="block">{c.titleLine1}</span>
                <span className="block text-[var(--color-text-dim)]">
                  {c.titleLine2}
                </span>
              </h1>
            </div>
            <div className="lg:col-span-5 self-end">
              <p className="text-body max-w-md">{c.body}</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="https://physics.it.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  {c.visitSite}
                  <span>↗</span>
                </Link>
                <Link
                  href="https://physics.it.com/ask"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  {c.tryAsk}
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
                {c.figureCaption}
              </div>
            </div>

            <div className="lg:col-span-4">
              <Panel innerClassName="p-6 lg:p-8" corners>
                <p className="text-label-sm text-[var(--color-text-faint)] mb-4">
                  {c.specsLabel}
                </p>
                {c.specs.map((row) => (
                  <SpecRow key={row.label} label={row.label} value={row.value} />
                ))}
                <div className="mt-6 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary-glow)] pulse-dot" />
                  <span className="text-mono text-[var(--color-primary-glow)]">
                    {dict.common.liveNominal}
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
                {c.aboutEyebrow}
              </p>
              <h2 className="text-headline">
                <span className="block">{c.aboutTitleA}</span>
                <span className="block text-[var(--color-text-dim)]">
                  {c.aboutTitleB}
                </span>
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6 space-y-5">
              {c.aboutBody.map((p, i) => (
                <p key={i} className="text-body">
                  {p}
                </p>
              ))}
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
                  {c.askEyebrow}
                </p>
                <h2 className="text-headline mb-6">
                  <span className="block">{c.askTitleA}</span>
                  <span className="block text-[var(--color-text-dim)]">
                    {c.askTitleB}
                  </span>
                </h2>
                <p className="text-body max-w-xl mb-5">{c.askBody1}</p>
                <p className="text-body max-w-xl">{c.askBody2}</p>
              </div>
              <div className="lg:col-span-5">
                <div className="border-l border-[var(--color-border)] lg:pl-10">
                  <p className="text-label-sm text-[var(--color-text-faint)] mb-5">
                    {c.askExamplesLabel}
                  </p>
                  <ul className="space-y-3">
                    {c.askExamples.map((q) => (
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
                      {c.askOpen}
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
              {c.insideEyebrow}
            </p>
            <h2 className="text-headline">{c.insideTitle}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {c.insideItems.map((item, i) => (
              <Panel key={item.label} innerClassName="p-8" corners>
                <div className="flex items-center justify-between mb-8">
                  <span className="text-mono text-[var(--color-text-faint)]">
                    0{i + 1} · {c.insideEntry}
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
                {c.designEyebrow}
              </p>
              <h2 className="text-headline">
                <span className="block">{c.designTitleA}</span>
                <span className="block text-[var(--color-text-dim)]">
                  {c.designTitleB}
                </span>
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <p className="text-body">{c.designBody}</p>
            </div>
          </div>

          {/* Palette swatches */}
          <p className="text-label-sm text-[var(--color-text-faint)] mb-4">
            {c.paletteLabel}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {productPalette.map((s) => (
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
            {c.typographyLabel}
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {c.typographyCards.map((card, i) => (
              <Panel key={card.code} innerClassName="p-8 lg:p-10" corners>
                <div className="text-mono text-[var(--color-primary-glow)] mb-6">
                  {card.code}
                </div>
                <div
                  style={{
                    fontFamily: typographyFontFamilies[i],
                    fontSize:
                      i === 0
                        ? "clamp(2.25rem, 3.6vw, 3rem)"
                        : i === 1
                          ? "clamp(1.375rem, 2vw, 1.75rem)"
                          : "clamp(1.0625rem, 1.3vw, 1.25rem)",
                    fontWeight: i === 0 ? 500 : 400,
                    letterSpacing:
                      i === 0
                        ? "-0.03em"
                        : i === 1
                          ? "-0.005em"
                          : "0.04em",
                    lineHeight: i === 0 ? 0.98 : i === 1 ? 1.3 : 1.4,
                    color: "var(--color-text)",
                    direction: "ltr",
                    unicodeBidi: "isolate",
                  }}
                >
                  {card.sample}
                </div>
                <div className="mt-6 text-label-sm text-[var(--color-text-dim)]">
                  {card.name}
                </div>
                <p className="mt-3 text-body">{card.body}</p>
              </Panel>
            ))}
          </div>
        </div>
      </section>

      {/* Branches — all live */}
      <section className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-8">
            <div className="lg:col-span-4">
              <p className="text-mono text-[var(--color-primary-glow)] mb-6">
                {c.branchesEyebrow}
              </p>
              <h2 className="text-headline">
                <span className="block">{c.branchesTitleA}</span>
                <span className="block text-[var(--color-text-dim)]">
                  {c.branchesTitleB}
                </span>
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <p className="text-body">{c.branchesBody}</p>
            </div>
          </div>

          <Panel innerClassName="p-0" corners>
            <ul>
              {c.branches.map((b, i) => (
                <li
                  key={b.id}
                  className={`grid grid-cols-12 items-center gap-4 px-6 lg:px-8 py-5 ${
                    i < c.branches.length - 1
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
                      {c.live}
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
                  {c.ctaEyebrow}
                </p>
                <h2 className="text-headline">{c.ctaTitle}</h2>
                <p className="text-body mt-5 max-w-lg">{c.ctaBody}</p>
              </div>
              <div className="lg:col-span-4 flex lg:justify-end">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="https://physics.it.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    {c.visitSite}
                    <span>↗</span>
                  </Link>
                  <Link
                    href="https://physics.it.com/ask"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    {c.tryAsk}
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
