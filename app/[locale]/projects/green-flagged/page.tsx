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
const PROJECT_URL = "https://greenflagged.vercel.app/";

const GREENFLAGGED_KEYWORDS = [
  "Green Flagged",
  "AI contract review",
  "contract reviewer for freelancers",
  "freelancer contract scanner",
  "plain language contract review",
  "PDF contract review AI",
  "redline suggestions AI",
  "clause taxonomy scanner",
  "contract risk grading",
  "legal-tech case study",
  "Simnetiq case study Green Flagged",
  "IP ownership clause review",
  "payment terms clause review",
  "termination clause review",
  "NDA scope review",
  "liability cap review",
  "auto-renewal clause review",
  "kill fee clause review",
  "exclusivity clause review",
  "small business contract review",
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
    routeKey: "caseStudyGreenFlagged",
    path: "/projects/green-flagged",
    keywords: GREENFLAGGED_KEYWORDS,
    ogImage: "/greenflagged-header.avif",
    ogType: "article",
    markdownAlternate: true,
  });
}

// Green Flagged design system — referenced on this Simnetiq page as case-study content.
// Paper + ink neutrals with a sage-green accent. Severity reds/ambers reserved for
// signal use only, but shown here as part of the documented palette.
const greenFlaggedPalette = [
  { name: "Paper", hex: "#F5F2EA", role: "Background" },
  { name: "Bone", hex: "#EAE5D6", role: "Surface" },
  { name: "Ink", hex: "#1A1A17", role: "Foreground", onDark: true },
  { name: "Sage", hex: "#7A9B6E", role: "Accent" },
  { name: "Green", hex: "#3F8F3F", role: "Severity · OK" },
  { name: "Amber", hex: "#D4A93C", role: "Severity · Note" },
  { name: "Orange", hex: "#C8632C", role: "Severity · Warn" },
  { name: "Red", hex: "#B83830", role: "Severity · Flag" },
];

const typographyFontFamilies = [
  "var(--font-inter), system-ui, sans-serif",
  "var(--font-inter), system-ui, sans-serif",
  "var(--font-jetbrains), ui-monospace, monospace",
];

type Params = Promise<{ locale: string }>;

export default async function GreenFlaggedPage({ params }: { params: Params }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);
  const c = dict.caseStudyGreenFlagged;

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: `${SITE_URL}/${locale}` },
          { name: "Projects", url: `${SITE_URL}/${locale}/projects` },
          {
            name: "Green Flagged",
            url: `${SITE_URL}/${locale}/projects/green-flagged`,
          },
        ]}
      />
      <CaseStudyArticleSchema
        headline={`${c.titleLine1} ${c.titleLine2}`.trim()}
        path="/projects/green-flagged"
        description={c.body}
        image="/greenflagged-header.avif"
        locale={locale}
        datePublished="2026-05-12"
        dateModified={new Date().toISOString().slice(0, 10)}
        keywords={GREENFLAGGED_KEYWORDS}
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
                  href={PROJECT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  {c.visitSite}
                  <span>↗</span>
                </Link>
                <Link
                  href={PROJECT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  {c.tryFree}
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
                    src="/greenflagged-header.avif"
                    alt="Green Flagged — AI contract review homepage with drop-zone"
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
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)] pulse-dot" />
                  <span className="text-mono text-[var(--color-secondary)]">
                    {dict.common.inDevNominal}
                  </span>
                </div>
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

      {/* Pricing */}
      <section className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-12">
            <div className="lg:col-span-4">
              <p className="text-mono text-[var(--color-primary-glow)] mb-6">
                {c.pricingEyebrow}
              </p>
              <h2 className="text-headline">
                <span className="block">{c.pricingTitleA}</span>
                <span className="block text-[var(--color-text-dim)]">
                  {c.pricingTitleB}
                </span>
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <p className="text-body">{c.pricingBody}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {c.pricingTiers.map((tier) => (
              <div key={tier.id} className="relative flex">
                {tier.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 text-label-sm bg-[var(--color-primary-glow)] text-[var(--color-bg)] tracking-wider whitespace-nowrap">
                    {c.popularLabel}
                  </span>
                )}
                <Panel
                  innerClassName={`p-6 lg:p-8 h-full w-full flex flex-col ${
                    tier.popular
                      ? "ring-1 ring-[var(--color-primary-glow)]"
                      : ""
                  }`}
                  corners
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-mono text-[var(--color-text-faint)]">
                      // {tier.id}
                    </span>
                    <span className="text-label-sm text-[var(--color-primary-glow)]">
                      {tier.name.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-title mb-2">{tier.name}</div>
                  <p className="text-body text-[var(--color-text-dim)] mb-6">
                    {tier.tagline}
                  </p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span
                      style={{
                        fontSize: "clamp(2.25rem, 3.6vw, 3rem)",
                        fontWeight: 500,
                        letterSpacing: "-0.025em",
                        lineHeight: 1,
                        color: "var(--color-text)",
                      }}
                    >
                      {tier.price}
                    </span>
                  </div>
                  <div className="text-mono text-[var(--color-text-dim)] mb-6">
                    {tier.cadence}
                  </div>
                  <ul className="space-y-3 flex-1 mb-8">
                    {tier.bullets.map((b) => (
                      <li
                        key={b.text}
                        className={`text-body flex items-start gap-3 ${
                          b.included
                            ? ""
                            : "text-[var(--color-text-faint)] line-through decoration-[var(--color-text-faint)]/40"
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`mt-1 inline-flex items-center justify-center w-4 h-4 text-mono shrink-0 ${
                            b.included
                              ? "text-[var(--color-primary-glow)]"
                              : "text-[var(--color-text-faint)]"
                          }`}
                        >
                          {b.included ? "✓" : "—"}
                        </span>
                        <span>{b.text}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={PROJECT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={tier.popular ? "btn-primary" : "btn-secondary"}
                  >
                    {tier.cta}
                    <span>↗</span>
                  </Link>
                </Panel>
              </div>
            ))}
          </div>
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

      {/* Design system — palette + typography */}
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {greenFlaggedPalette.map((s) => (
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
                        ? "clamp(2rem, 3.2vw, 2.75rem)"
                        : i === 1
                          ? "clamp(1.25rem, 1.8vw, 1.5rem)"
                          : "clamp(1rem, 1.2vw, 1.125rem)",
                    fontWeight: i === 0 ? 600 : i === 1 ? 400 : 400,
                    letterSpacing:
                      i === 0
                        ? "-0.04em"
                        : i === 1
                          ? "-0.005em"
                          : "0.04em",
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

      {/* Clause taxonomy */}
      <section className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-8">
            <div className="lg:col-span-4">
              <p className="text-mono text-[var(--color-primary-glow)] mb-6">
                {c.taxonomyEyebrow}
              </p>
              <h2 className="text-headline">
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
                  <span className="col-span-7 md:col-span-8 text-title">
                    {t.name}
                  </span>
                  <span className="col-span-3 md:col-span-3 flex justify-end items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-secondary)] pulse-dot" />
                    <span className="text-label-sm text-[var(--color-secondary)]">
                      {c.inDev}
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
                    href={PROJECT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    {c.ctaPrimary}
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
