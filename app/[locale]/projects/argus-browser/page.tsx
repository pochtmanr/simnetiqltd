import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel, SpecRow } from "@/components/panel";
import { ProjectStatus } from "@/components/project-status";
import { ProjectLogo } from "@/components/project-logo";
import { CardArrow } from "@/components/sections/card-arrow";
import { TechnologyChips } from "@/components/technology-chips";
import styles from "@/components/case-study.module.css";
import {
  BreadcrumbSchema,
  CaseStudyArticleSchema,
} from "@/components/structured-data";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, localizePath, type Locale } from "@/lib/i18n";
import { buildLocalizedMetadata } from "@/lib/seo-meta";
import { SITE_URL } from "@/lib/site";

const PROJECT_URL = "https://www.browserargus.com/";

const ARGUS_KEYWORDS = [
  "Argus Browser",
  "browserargus.com",
  "anti-detect browser",
  "antidetect browser",
  "Chromium fork",
  "browser fingerprinting",
  "fingerprint spoofing",
  "multi-account browser",
  "browser profile isolation",
  "per-profile proxy",
  "WebRTC leak prevention",
  "browser automation platform",
  "MCP browser automation",
  "Electron desktop app",
  "Simnetiq case study Argus",
  "browser engineering case study",
  "C++ Chromium engineering",
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
    routeKey: "caseStudyArgus",
    path: "/projects/argus-browser",
    keywords: ARGUS_KEYWORDS,
    ogImage: "/argus-header.avif",
    ogImageWidth: 1600,
    ogImageHeight: 900,
    ogType: "article",
    markdownAlternate: true,
  });
}

// Argus design system — referenced on this Simnetiq page as case-study content.
// Token names and values lifted from the Argus DESIGN.md light theme. Every
// neutral is deliberately achromatic; cyan is the only hue with a job.
const argusPalette = [
  { name: "Paper", hex: "#F2F2F2", role: "Background" },
  { name: "Surface", hex: "#F7F7F7", role: "Surface" },
  { name: "Raised", hex: "#FFFFFF", role: "Raised" },
  { name: "Border", hex: "#E0E0E0", role: "Border" },
  { name: "Argus Cyan", hex: "#0E8AA6", role: "Accent" },
  { name: "Cyan Deep", hex: "#0A6F87", role: "Accent · Pressed" },
  { name: "Signal Green", hex: "#2E9E5B", role: "Signal · Healthy" },
  { name: "Ink", hex: "#1F1F1F", role: "Foreground", onDark: true },
];

const typographyFontFamilies = [
  "var(--font-geist), system-ui, sans-serif",
  "var(--font-geist), system-ui, sans-serif",
  "var(--font-geist-mono), ui-monospace, monospace",
];

type Params = Promise<{ locale: string }>;

export default async function ArgusBrowserPage({ params }: { params: Params }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);
  const c = dict.caseStudyArgus;

  return (
    <div className={styles.page}>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: `${SITE_URL}/${locale}` },
          { name: "Projects", url: `${SITE_URL}/${locale}/projects` },
          {
            name: "Argus Browser",
            url: `${SITE_URL}/${locale}/projects/argus-browser`,
          },
        ]}
      />
      <CaseStudyArticleSchema
        headline={`${c.titleLine1} ${c.titleLine2}`.trim()}
        path="/projects/argus-browser"
        description={c.body}
        image="/argus-header.avif"
        locale={locale}
        datePublished="2026-08-19"
        dateModified={new Date().toISOString().slice(0, 10)}
        keywords={ARGUS_KEYWORDS}
      />

      {/* Hero */}
      <section data-nav-hero="">
        <div className={`${styles.hero} mx-auto max-w-[1440px] px-6 lg:px-12`}>
          <div className={styles.projectNav}>
            <Link href={localizePath(locale, "/projects")} className={styles.backLink}>
              <span aria-hidden="true">←</span> {dict.nav.links.projects}
            </Link>
            <ProjectStatus project="argus" labels={dict.projectsPage.statuses} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <div className={styles.identity}>
                <ProjectLogo
                  project="argus"
                  alt="Argus Browser"
                  size={32}
                />
                <p className={styles.eyebrow}>
                  {c.eyebrow}
                </p>
              </div>
              <h1 className={styles.title}>
                <span className="block">{c.titleLine1}</span>
                <span className="block text-[var(--color-text-dim)]">
                  {c.titleLine2}
                </span>
              </h1>
            </div>
            <div className="lg:col-span-5 self-end">
              <p className="text-body max-w-lg">{c.body}</p>
              <div className="mt-6">
                <TechnologyChips
                  technologies={["C++", "Chromium", "Electron", "React", "Vite", "Supabase"]}
                  label={dict.projects.stack}
                />
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={PROJECT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.primaryLink}
                >
                  {c.visitSite}
                  <CardArrow external />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Header image + specs */}
      <section>
        <div className={`mx-auto max-w-[1440px] px-6 lg:px-12 ${styles.overview}`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            <div className="lg:col-span-8">
              <div className={styles.imageFrame}>
                <div className="relative w-full overflow-hidden aspect-[16/9]">
                  <Image
                    src="/argus-header.avif"
                    alt="Argus Browser key art — the Argus helmet over a dithered night cityscape, captioned “The New Era of Agentic Browsing by Simnetiq”"
                    fill
                    priority
                    sizes="(min-width: 1440px) 896px, (min-width: 1024px) 66vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </div>
              <div className={`${styles.caption} mt-4`}>
                {c.figureCaption}
              </div>
            </div>

            <div className="lg:col-span-4">
              <Panel innerClassName="p-6 lg:p-8" corners>
                <p className={`${styles.sectionLabel} mb-4`}>
                  {c.specsLabel}
                </p>
                {/* The first specification is Status, already shown in the hero. */}
                {c.specs.slice(1).map((row) => (
                  <SpecRow key={row.label} label={row.label} value={row.value} />
                ))}
              </Panel>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <p className={`${styles.sectionLabel} mb-5`}>
                {c.aboutEyebrow}
              </p>
              <h2 className={styles.heading}>
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

      {/* What's inside — four decision cards */}
      <section className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="mb-10">
            <p className={`${styles.sectionLabel} mb-5`}>
              {c.insideEyebrow}
            </p>
            <h2 className={styles.heading}>{c.insideTitle}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {c.insideItems.map((item, i) => (
              <Panel key={item.label} innerClassName={styles.featureCard}>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <span className="text-mono text-[var(--color-text-faint)]">
                    0{i + 1} · {c.insideEntry}
                  </span>
                  <span className="text-label-sm text-[var(--color-primary-glow)]">
                    {item.label}
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
                    direction: "ltr",
                    unicodeBidi: "isolate",
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

      {/* Design system — palette + typography */}
      <section className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-12">
            <div className="lg:col-span-4">
              <p className={`${styles.sectionLabel} mb-5`}>
                {c.designEyebrow}
              </p>
              <h2 className={styles.heading}>
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
          <p className={`${styles.sectionLabel} mb-4`}>
            {c.paletteLabel}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {argusPalette.map((s) => (
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
              <Panel key={card.code} innerClassName="p-6 lg:p-8">
                <div className={`${styles.sectionLabel} mb-5`}>
                  {card.code}
                </div>
                <div
                  style={{
                    fontFamily: typographyFontFamilies[i],
                    fontSize:
                      i === 0
                        ? "clamp(2rem, 3.2vw, 2.75rem)"
                        : i === 1
                          ? "clamp(1.25rem, 1.8vw, 1.5rem)"
                          : "clamp(1rem, 1.2vw, 1.125rem)",
                    fontWeight: i === 0 ? 600 : i === 1 ? 400 : 400,
                    letterSpacing:
                      i === 0 ? "-0.04em" : i === 1 ? "-0.005em" : "0.04em",
                    lineHeight: i === 0 ? 0.95 : i === 1 ? 1.35 : 1.45,
                    color: "var(--color-text)",
                    textTransform: i === 0 ? "uppercase" : "none",
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

      {/* Surfaces */}
      <section className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-8">
            <div className="lg:col-span-4">
              <p className={`${styles.sectionLabel} mb-5`}>
                {c.taxonomyEyebrow}
              </p>
              <h2 className={styles.heading}>
                <span className="block">{c.taxonomyTitleA}</span>
                <span className="block text-[var(--color-text-dim)]">
                  {c.taxonomyTitleB}
                </span>
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <p className="text-body">{c.taxonomyBody}</p>
            </div>
          </div>

          <Panel innerClassName="p-0" corners>
            <ul>
              {c.taxonomy.map((t, i) => (
                <li
                  key={t.id}
                  className={`grid grid-cols-12 items-center gap-4 px-6 lg:px-8 py-5 ${
                    i < c.taxonomy.length - 1
                      ? "border-b border-[var(--color-border)]"
                      : ""
                  }`}
                >
                  <span className="col-span-2 md:col-span-1 text-mono text-[var(--color-text-faint)]">
                    {t.id}
                  </span>
                  <span className="col-span-10 md:col-span-7 text-title">
                    {t.name}
                  </span>
                  <span className={`${styles.status} col-span-12 md:col-span-4 md:justify-self-end`}>
                    <span aria-hidden="true" className="inline-block w-1.5 h-1.5 shrink-0 rounded-full bg-current" />
                    <span>
                      {dict.common.inDevNominal}
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
          <Panel className={styles.cta} innerClassName="p-8 lg:p-14" corners>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-8">
                <p className={`${styles.sectionLabel} mb-5`}>
                  {c.ctaEyebrow}
                </p>
                <h2 className={styles.heading}>{c.ctaTitle}</h2>
                <p className="text-body mt-5 max-w-lg">{c.ctaBody}</p>
              </div>
              <div className="lg:col-span-4 flex lg:justify-end">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={PROJECT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.primaryLink}
                  >
                    {c.ctaPrimary}
                    <CardArrow external />
                  </Link>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}
