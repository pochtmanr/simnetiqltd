import type { Metadata } from "next";
import Link from "next/link";
import { Panel, Rail, SpecRow } from "@/components/panel";
import { BreadcrumbSchema } from "@/components/structured-data";

const SITE_URL = "https://simnetiq.store";

export const metadata: Metadata = {
  title: "About Simnetiq — London Software & Marketing Studio",
  description:
    "About Simnetiq Ltd — a London-based technology studio and engineering collective. Incorporated in England & Wales (Company No. 16861177). Three owner-operators covering mobile, web, AI, VPN infrastructure, paid acquisition, and legal. Registered at 2 Frederick Street, Kings Cross, London.",
  keywords: [
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
  ],
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
  openGraph: {
    title: "About Simnetiq — London Technology Studio",
    description:
      "Simnetiq Ltd is a London-based engineering and marketing collective. Three owner-operators, full-stack capabilities, incorporated in England & Wales.",
    url: `${SITE_URL}/about`,
    siteName: "Simnetiq",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Simnetiq — London Technology Studio",
    description:
      "Simnetiq Ltd is a London-based engineering and marketing collective. Three owner-operators, full-stack capabilities.",
  },
};

const team = [
  {
    role: "Lead Engineer / Director",
    name: "R. Pochtman",
    meta: "Mobile · Backend · Infra",
  },
  {
    role: "Legal / Contracts",
    name: "D. Zitomirsky",
    meta: "Corporate · Compliance",
  },
  {
    role: "Developer / Growth",
    name: "D. Polskoy",
    meta: "Distribution · Marketing",
  },
];

const values = [
  {
    code: "V-01",
    title: "Precision",
    text: "Mathematics over aesthetics. Every pixel, every line, every abstraction serves a structural purpose.",
  },
  {
    code: "V-02",
    title: "Function",
    text: "We build instruments, not toys. UI is for control, not decoration.",
  },
  {
    code: "V-03",
    title: "Integrity",
    text: "Direct communication. Transparent architecture. Unwavering quality.",
  },
  {
    code: "V-04",
    title: "Legacy",
    text: "Rooted in Scandinavian and British industrial design principles.",
  },
];

export default function AboutPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: `${SITE_URL}/` },
          { name: "About", url: `${SITE_URL}/about` },
        ]}
      />
      {/* Hero */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 pt-12 lg:pt-20 pb-16 lg:pb-24">
          <Rail
            items={[
              "◆ SIMNETIQ / 02 / ABOUT",
              "MISSION CONTEXT",
              "DOSSIER · V1.0",
            ]}
            className="mb-10"
          />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-8">
              <p className="text-label text-[var(--color-primary-glow)]">
                ◇ Mission Context
              </p>
              <h1 className="text-display mt-6">
                We build the kinetic blueprint for industrial software.
              </h1>
              <p className="text-body mt-8 max-w-xl">
                Simnetiq is a technical design and engineering collective. We
                reject decorative trends in favor of functional precision and
                geometric absolutism — software that reads as an instrument, not
                a decoration.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-5">
              <Panel innerClassName="p-6">
                <p className="text-label-sm text-[var(--color-text-faint)] mb-3">
                  ▸ Founded
                </p>
                <p className="text-display" style={{ fontSize: "clamp(2.25rem, 4vw, 3.25rem)" }}>
                  2025
                </p>
              </Panel>
              <Panel innerClassName="p-6">
                <p className="text-label-sm text-[var(--color-text-faint)] mb-3">
                  ▸ Operations
                </p>
                <p className="text-headline">London, UK</p>
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
                ◇ Personnel
              </p>
              <h2 className="text-headline mt-5">The architecture team</h2>
              <p className="text-body mt-6 max-w-sm">
                Three owner-operators. Engineering, legal, distribution. No
                layers between the work and the decision.
              </p>
            </div>
            <div className="lg:col-span-8">
              <Panel innerClassName="p-6 lg:p-8" corners>
                {team.map((member, i) => (
                  <div
                    key={member.name}
                    className={`grid grid-cols-12 gap-4 py-5 ${
                      i < team.length - 1
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

      {/* Registration split */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <p className="text-label text-[var(--color-primary-glow)]">
                ◇ Registration
              </p>
              <h2 className="text-headline mt-5">Certified entity</h2>
              <p className="text-body mt-6 max-w-sm">
                Incorporated in England &amp; Wales. All trading, contracting,
                and invoicing runs through the parent entity.
              </p>
            </div>
            <div className="lg:col-span-4">
              <Panel innerClassName="p-6 lg:p-8">
                <p className="text-label-sm text-[var(--color-text-faint)] mb-5">
                  ▸ Company Details
                </p>
                <SpecRow label="Legal name" value="Simnetiq Ltd" />
                <SpecRow label="Company no." value="16861177" />
                <SpecRow label="Jurisdiction" value="England & Wales" />
                <SpecRow label="VAT status" value="On request" />
              </Panel>
            </div>
            <div className="lg:col-span-4">
              <Panel innerClassName="p-6 lg:p-8">
                <p className="text-label-sm text-[var(--color-text-faint)] mb-5">
                  ▸ Registered Address
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
                  View on Google Maps →
                </Link>
              </Panel>
            </div>
          </div>
        </div>
      </section>

      {/* Values grid */}
      <section>
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-10">
            <div className="lg:col-span-4">
              <p className="text-label text-[var(--color-primary-glow)]">
                ◇ Principles
              </p>
              <h2 className="text-headline mt-5">Operating values</h2>
            </div>
            <div className="lg:col-span-6 lg:col-start-7 self-end">
              <p className="text-body max-w-md">
                Four constants that every project, hire, and decision is
                measured against.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {values.map((value) => (
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
