"use client";

import { useEffect, useState } from "react";
import { Panel, Rail, SpecRow } from "@/components/panel";

type LegalRow = { label: string; value: string };
type LegalBlock = { title: string; body: string };

export type LegalDict = {
  rail: { index: string; compliance: string; rev: string };
  eyebrow: string;
  title: string;
  tocLabel: string;
  tocSections: { number: string; label: string }[];
  documentLabel: string;
  revision: string;
  protocol: string;
  jurisdiction: string;
  jurisdictionValue: string;
  impressum: { tag: string; title: string; rows: LegalRow[] };
  privacy: { tag: string; title: string; blocks: LegalBlock[] };
  terms: { tag: string; title: string; blocks: LegalBlock[] };
};

export type CommonDict = {
  revisionApr2026: string;
  lastRevisionApr2026: string;
  endOfDocument: string;
};

const SECTION_IDS = ["impressum", "privacy", "terms"] as const;
type SectionId = (typeof SECTION_IDS)[number];

export function LegalClient({
  dict,
  common,
}: {
  dict: LegalDict;
  common: CommonDict;
}) {
  const [active, setActive] = useState<SectionId>("impressum");

  useEffect(() => {
    function handleScroll() {
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 160) setActive(id);
        }
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const year = new Date().getFullYear();

  return (
    <>
      {/* Hero */}
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 pt-12 lg:pt-20 pb-14 lg:pb-20">
          <Rail
            items={[dict.rail.index, dict.rail.compliance, dict.rail.rev]}
            className="mb-10"
          />
          <p className="text-label text-[var(--color-primary-glow)]">
            {dict.eyebrow}
          </p>
          <h1 className="text-display mt-6 max-w-3xl">{dict.title}</h1>
        </div>
      </section>

      {/* Split: TOC left, content right */}
      <section>
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            {/* TOC sidebar */}
            <nav className="lg:col-span-3">
              <div className="lg:sticky lg:top-28">
                <p className="text-label-sm text-[var(--color-text-faint)] mb-5">
                  {dict.tocLabel}
                </p>
                <div className="flex flex-col">
                  {dict.tocSections.map((s, i) => {
                    const id = SECTION_IDS[i];
                    const isActive = active === id;
                    return (
                      <a
                        key={id}
                        href={`#${id}`}
                        className={`flex items-center justify-between py-3 border-b border-[var(--color-border)] transition-colors ${
                          isActive
                            ? "text-[var(--color-text)]"
                            : "text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={`text-mono ${
                              isActive
                                ? "text-[var(--color-primary-glow)]"
                                : "text-[var(--color-text-faint)]"
                            }`}
                          >
                            {s.number}
                          </span>
                          <span className="text-label-sm">{s.label}</span>
                        </span>
                        {isActive && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary-glow)] pulse-dot" />
                        )}
                      </a>
                    );
                  })}
                </div>
                <div className="mt-8">
                  <Panel innerClassName="p-5">
                    <p className="text-label-sm text-[var(--color-text-faint)] mb-3">
                      {dict.documentLabel}
                    </p>
                    <SpecRow
                      label={dict.revision}
                      value={common.revisionApr2026}
                    />
                    <SpecRow label={dict.protocol} value="1.0.0" />
                    <SpecRow
                      label={dict.jurisdiction}
                      value={dict.jurisdictionValue}
                    />
                  </Panel>
                </div>
              </div>
            </nav>

            {/* Content */}
            <div className="lg:col-span-9 space-y-14 lg:space-y-20">
              {/* Impressum */}
              <article id="impressum" className="scroll-mt-32">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-mono text-[var(--color-primary-glow)]">
                    [01]
                  </span>
                  <span className="text-label-sm text-[var(--color-text-faint)]">
                    {dict.impressum.tag}
                  </span>
                </div>
                <h2 className="text-headline mb-8">{dict.impressum.title}</h2>
                <Panel innerClassName="p-6 lg:p-8">
                  {dict.impressum.rows.map((r) => (
                    <SpecRow key={r.label} label={r.label} value={r.value} />
                  ))}
                </Panel>
              </article>

              {/* Privacy */}
              <article id="privacy" className="scroll-mt-32">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-mono text-[var(--color-primary-glow)]">
                    [02]
                  </span>
                  <span className="text-label-sm text-[var(--color-text-faint)]">
                    {dict.privacy.tag}
                  </span>
                </div>
                <h2 className="text-headline mb-8">{dict.privacy.title}</h2>
                <div className="space-y-8 max-w-3xl">
                  {dict.privacy.blocks.map((b, i) => (
                    <LegalBlockRow
                      key={b.title}
                      number={String(i + 1)}
                      title={b.title}
                      body={b.body}
                    />
                  ))}
                </div>
              </article>

              {/* Terms */}
              <article id="terms" className="scroll-mt-32">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-mono text-[var(--color-primary-glow)]">
                    [03]
                  </span>
                  <span className="text-label-sm text-[var(--color-text-faint)]">
                    {dict.terms.tag}
                  </span>
                </div>
                <h2 className="text-headline mb-6">{dict.terms.title}</h2>
                <p className="text-mono mb-8">{common.lastRevisionApr2026}</p>
                <div className="space-y-8 max-w-3xl">
                  {dict.terms.blocks.map((b, i) => (
                    <LegalBlockRow
                      key={b.title}
                      number={String(i + 1)}
                      title={b.title}
                      body={b.body}
                    />
                  ))}
                </div>
              </article>

              <div className="border-t border-[var(--color-border)] pt-8">
                <p className="text-mono">
                  {common.endOfDocument.replace("{year}", String(year))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function LegalBlockRow({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-2 sm:col-span-1 text-mono text-[var(--color-text-faint)] pt-1">
        {number}
      </div>
      <div className="col-span-10 sm:col-span-11">
        <h3 className="text-title mb-2">{title}</h3>
        <p className="text-body">{body}</p>
      </div>
    </div>
  );
}
