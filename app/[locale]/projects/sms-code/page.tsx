import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel, SpecRow } from "@/components/panel";
import { ProjectLogo } from "@/components/project-logo";
import { CardArrow } from "@/components/sections/card-arrow";
import { TechnologyChips } from "@/components/technology-chips";
import styles from "@/components/case-study.module.css";
import {
  BreadcrumbSchema,
  CaseStudyArticleSchema,
} from "@/components/structured-data";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";
import { buildLocalizedMetadata } from "@/lib/seo-meta";
import { SITE_URL } from "@/lib/site";

const PROJECT_URL = "https://simnetiq.xyz/";
const APP_STORE_URL = "https://apps.apple.com/us/app/id6803515179";

const SMSCODE_KEYWORDS = [
  "SMS Code",
  "SMS Code by SIMNETIQ",
  // The app shipped as SMS Activate until the Aug 2026 rebrand; the old name
  // still carries search volume and the old slug still redirects here.
  "SMS Activate",
  "simnetiq.xyz",
  "virtual numbers",
  "virtual phone number",
  "SMS verification",
  "receive SMS online",
  "temporary phone number",
  "disposable phone number",
  "one-time verification code",
  "sign-up verification number",
  "Telegram verification number",
  "WhatsApp verification number",
  "privacy phone number",
  "no subscription virtual number",
  "carrier network numbers",
  "Simnetiq case study SMS Code",
  "telecom case study",
  "virtual number iOS app",
  "virtual number Android app",
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
    routeKey: "caseStudySmsCode",
    path: "/projects/sms-code",
    keywords: SMSCODE_KEYWORDS,
    ogImage: "/smscode-header.avif",
    ogType: "article",
    markdownAlternate: true,
  });
}

// SMS Code design system — referenced on this Simnetiq page as case-study
// content. Token names and hexes lifted verbatim from the live simnetiq.xyz
// stylesheet after the Aug 2026 rebrand: a cool paper greyscale carrying one
// blue ramp, from the light accent that opens the logo gradient down to the
// deep tone the display type is set in.
const smsCodePalette = [
  { name: "Canvas", hex: "#EFF1F5", role: "Background" },
  { name: "Card", hex: "#FFFFFF", role: "Surface" },
  { name: "Panel Strong", hex: "#C8DCF7", role: "Panel" },
  { name: "Accent", hex: "#59A1FC", role: "Gradient start" },
  { name: "Accent Dark", hex: "#276CC5", role: "Gradient end" },
  { name: "Accent Deep", hex: "#1E5AA8", role: "Display type", onDark: true },
  { name: "Ink", hex: "#23262C", role: "Foreground", onDark: true },
];

// 01 Inter carries the hero and the interface; 02 Cormorant Garamond is the
// display accent the rebrand introduced, set light for section headings and
// the big coverage figures; 03 mono is reserved for copyable strings.
// Specimens were index-keyed while all three cards were Inter cuts. Now that
// each card is a different family with its own optical size, they carry their
// own settings.
const typographySpecs = [
  {
    fontFamily: "var(--font-inter), system-ui, sans-serif",
    fontSize: "clamp(2rem, 3.2vw, 2.75rem)",
    fontWeight: 500,
    letterSpacing: "-0.04em",
    lineHeight: 0.95,
  },
  {
    fontFamily: "var(--font-cormorant), ui-serif, Georgia, serif",
    fontSize: "clamp(2.5rem, 4vw, 3.25rem)",
    fontWeight: 300,
    letterSpacing: "-0.03em",
    lineHeight: 1,
  },
  {
    fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
    fontSize: "clamp(1rem, 1.2vw, 1.125rem)",
    fontWeight: 400,
    letterSpacing: "0.04em",
    lineHeight: 1.45,
  },
] as const;

type Params = Promise<{ locale: string }>;

export default async function SmsCodePage({ params }: { params: Params }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);
  const c = dict.caseStudySmsCode;

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: `${SITE_URL}/${locale}` },
          { name: "Projects", url: `${SITE_URL}/${locale}/projects` },
          {
            name: "SMS Code",
            url: `${SITE_URL}/${locale}/projects/sms-code`,
          },
        ]}
      />
      <CaseStudyArticleSchema
        headline={`${c.titleLine1} ${c.titleLine2}`.trim()}
        path="/projects/sms-code"
        description={c.body}
        image="/smscode-header.avif"
        locale={locale}
        datePublished="2026-07-16"
        dateModified={new Date().toISOString().slice(0, 10)}
        keywords={SMSCODE_KEYWORDS}
      />

      {/* Hero */}
      <section className="border-b border-[var(--color-border)]">
        <div className={`mx-auto max-w-[1440px] px-6 lg:px-12 ${styles.hero}`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
            <div className="lg:col-span-7">
              <ProjectLogo
                project="smscode"
                alt="SMS Code"
                size={56}
                className="mb-6"
              />
              <p className={styles.eyebrow}>
                {c.eyebrow}
              </p>
              <h1 className="text-display mt-5">
                <span className="block">{c.titleLine1}</span>
                <span className="block text-[var(--color-text-dim)]">
                  {c.titleLine2}
                </span>
              </h1>
            </div>
            <div className="lg:col-span-5 self-end min-w-0">
              <p className="text-body max-w-md">{c.body}</p>
              <div className="mt-6">
                <TechnologyChips
                  technologies={["Next.js", "React", "Tailwind", "iOS"]}
                  label={dict.projects.stack}
                />
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href={PROJECT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  {c.visitSite}
                  <CardArrow external />
                </Link>
                <Link
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  {c.tryFree}
                  <CardArrow external />
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
              <div className={styles.imageFrame}>
                <div className="relative w-full overflow-hidden aspect-[16/9]">
                  <Image
                    src="/smscode-header.avif"
                    alt="SMS Code by SIMNETIQ — virtual numbers for SMS verification in 150+ countries"
                    fill
                    priority
                    sizes="(min-width: 1440px) 896px, (min-width: 1024px) 66vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </div>
              <div className={styles.caption}>
                {c.figureCaption}
              </div>
            </div>

            <div className="lg:col-span-4">
              <Panel innerClassName="p-6 lg:p-8" corners>
                <p className={`${styles.sectionLabel} mb-4`}>
                  {c.specsLabel}
                </p>
                {c.specs.map((row) => (
                  <SpecRow key={row.label} label={row.label} value={row.value} />
                ))}
                <div className={`mt-6 ${styles.status}`}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary-glow)]" />
                  <span className="text-sm font-medium text-[var(--color-text-muted)]">
                    {dict.common.liveNominal}
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
              <p className={`${styles.sectionLabel} mb-5`}>
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

      {/* What's inside — four cards */}
      <section className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="mb-10">
            <p className={`${styles.sectionLabel} mb-5`}>
              {c.insideEyebrow}
            </p>
            <h2 className="text-headline">{c.insideTitle}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {c.insideItems.map((item, i) => (
              <Panel key={item.label} innerClassName={styles.featureCard}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                  <span className="text-mono text-[var(--color-text-faint)]">
                    0{i + 1}
                  </span>
                  <span className="text-sm font-medium text-[var(--color-text-muted)]">
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
          <p className={`${styles.sectionLabel} mb-4`}>
            {c.paletteLabel}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {smsCodePalette.map((s) => (
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
          <p className={`${styles.sectionLabel} mt-10 mb-4`}>
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
                    ...typographySpecs[i],
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

      {/* Service catalogue */}
      <section className="border-t border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-8">
            <div className="lg:col-span-4">
              <p className={`${styles.sectionLabel} mb-5`}>
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
                  className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-5 lg:px-8 py-5 ${
                    i < c.taxonomy.length - 1
                      ? "border-b border-[var(--color-border)]"
                      : ""
                  }`}
                >
                  <span className="text-mono text-[var(--color-text-faint)]">
                    {t.id}
                  </span>
                  <span className="text-title">
                    {t.name}
                  </span>
                  <span className="flex justify-end items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary-glow)]" />
                    <span className="text-sm font-medium text-[var(--color-text-muted)]">
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
                <p className={`${styles.sectionLabel} mb-5`}>
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
                    <CardArrow external />
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
