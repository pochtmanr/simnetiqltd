import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel, Rail, SpecRow } from "@/components/panel";
import { BreadcrumbSchema } from "@/components/structured-data";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n";
import { buildLocalizedMetadata } from "@/lib/seo-meta";

const SITE_URL = "https://simnetiq.store";

const ABOUT_KEYWORDS = [
  "About Simnetiq",
  "Simnetiq Ltd company",
  "Simnetiq company number",
  "Simnetiq London office",
  "Simnetiq team",
  "Simnetiq founders",
  "Roman Pochtman",
  "Dmitry Polskoy",
  "David Zitomirsky",
  "London software studio team",
  "technology studio Kings Cross",
  "England and Wales registered software company",
  "Companies House 16861177",
  "2 Frederick Street Kings Cross",
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
    routeKey: "about",
    path: "/about",
    keywords: ABOUT_KEYWORDS,
  });
}

type Params = Promise<{ locale: string }>;

export default async function AboutPage({ params }: { params: Params }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const dict = await getDictionary(locale);
  const a = dict.about;

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: `${SITE_URL}/${locale}` },
          { name: "About", url: `${SITE_URL}/${locale}/about` },
        ]}
      />
      {/* Hero */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 pt-12 lg:pt-20 pb-16 lg:pb-24">
          <Rail
            items={[a.rail.index, a.rail.context, a.rail.dossier]}
            className="mb-10"
          />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-8">
              <p className="text-label text-[var(--color-primary-glow)]">
                {a.eyebrow}
              </p>
              <h1 className="text-display mt-6">{a.title}</h1>
              <p className="text-body mt-8 max-w-xl">{a.body}</p>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-5">
              <Panel innerClassName="p-6">
                <p className="text-label-sm text-[var(--color-text-faint)] mb-3">
                  {a.founded}
                </p>
                <p className="text-display" style={{ fontSize: "clamp(2.25rem, 4vw, 3.25rem)" }}>
                  2025
                </p>
              </Panel>
              <Panel innerClassName="p-6">
                <p className="text-label-sm text-[var(--color-text-faint)] mb-3">
                  {a.operations}
                </p>
                <p className="text-headline">{a.operationsValue}</p>
                <p className="text-mono mt-2">51.5074°N · 0.1278°W</p>
              </Panel>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <p className="text-label text-[var(--color-primary-glow)]">
                {a.personnel.eyebrow}
              </p>
              <h2 className="text-headline mt-5">{a.personnel.title}</h2>
              <p className="text-body mt-6 max-w-sm">{a.personnel.body}</p>
            </div>
            <div className="lg:col-span-8">
              <Panel innerClassName="p-6 lg:p-8" corners>
                {a.team.map((member, i) => (
                  <div
                    key={member.name}
                    className={`grid grid-cols-12 gap-4 py-5 ${
                      i < a.team.length - 1
                        ? "border-b border-[var(--color-border)]"
                        : ""
                    }`}
                  >
                    <div className="col-span-2 sm:col-span-1 text-mono text-[var(--color-text-faint)]">
                      0{i + 1}
                    </div>
                    <div className="col-span-10 sm:col-span-5 text-body">
                      {member.role}
                    </div>
                    <div className="col-span-6 sm:col-span-3 text-label-sm text-[var(--color-text)]">
                      {member.name}
                    </div>
                    <div className="col-span-6 sm:col-span-3 text-mono text-right">
                      {member.meta}
                    </div>
                  </div>
                ))}
              </Panel>
            </div>
          </div>
        </div>
      </section>

      {/* Registration */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <p className="text-label text-[var(--color-primary-glow)]">
                {a.registration.eyebrow}
              </p>
              <h2 className="text-headline mt-5">{a.registration.title}</h2>
              <p className="text-body mt-6 max-w-sm">{a.registration.body}</p>
            </div>
            <div className="lg:col-span-4">
              <Panel innerClassName="p-6 lg:p-8">
                <p className="text-label-sm text-[var(--color-text-faint)] mb-5">
                  {a.registration.companyDetails}
                </p>
                <SpecRow label={a.registration.legalName} value="Simnetiq Ltd" />
                <SpecRow label={a.registration.companyNo} value="16861177" />
                <SpecRow
                  label={a.registration.jurisdiction}
                  value={a.registration.jurisdictionValue}
                />
                <SpecRow
                  label={a.registration.vatStatus}
                  value={a.registration.vatStatusValue}
                />
              </Panel>
            </div>
            <div className="lg:col-span-4">
              <Panel innerClassName="p-6 lg:p-8">
                <p className="text-label-sm text-[var(--color-text-faint)] mb-5">
                  {a.registration.registeredAddress}
                </p>
                <p className="text-body-strong text-[var(--color-text)]">
                  Simnetiq Ltd
                </p>
                <p className="text-body mt-2">2 Frederick Street</p>
                <p className="text-body">Kings Cross</p>
                <p className="text-body">London, WC1X 0ND</p>
                <p className="text-body">United Kingdom</p>
                <Link
                  href="https://maps.google.com/?q=2+Frederick+Street+Kings+Cross+London+WC1X+0ND"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-6 text-label-sm text-[var(--color-primary-glow)] hover:text-[var(--color-text)] transition-colors"
                >
                  {dict.common.viewOnGoogleMaps} <span>→</span>
                </Link>
              </Panel>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section>
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-10">
            <div className="lg:col-span-4">
              <p className="text-label text-[var(--color-primary-glow)]">
                {a.principles.eyebrow}
              </p>
              <h2 className="text-headline mt-5">{a.principles.title}</h2>
            </div>
            <div className="lg:col-span-6 lg:col-start-7 self-end">
              <p className="text-body max-w-md">{a.principles.body}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {a.values.map((value) => (
              <Panel key={value.code} innerClassName="p-6 h-full">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-mono text-[var(--color-text-faint)]">
                    {value.code}
                  </span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary-glow)]" />
                </div>
                <h3 className="text-title mb-3">{value.title}</h3>
                <p className="text-body">{value.text}</p>
              </Panel>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
