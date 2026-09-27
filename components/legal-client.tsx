"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import styles from "./document-pages.module.css";

type LegalRow = { label: string; value: string };
type LegalBlock = { title: string; body: string };

export type LegalDict = {
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
      <PageHeader title={dict.title} />
      <div className={styles.container}>
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <nav className={styles.nav} aria-label={dict.tocLabel}>
              {dict.tocSections.map((section, i) => (
                <a key={SECTION_IDS[i]} href={`#${SECTION_IDS[i]}`} aria-current={active === SECTION_IDS[i] ? "location" : undefined}>
                  {section.label}
                </a>
              ))}
            </nav>
            <h2 className={styles.label}>{dict.documentLabel}</h2>
            <dl className={styles.facts}>
              <div><dt>{dict.revision}</dt><dd>{common.revisionApr2026}</dd></div>
              <div><dt>{dict.jurisdiction}</dt><dd>{dict.jurisdictionValue}</dd></div>
            </dl>
          </aside>
          <div className={styles.content}>
            <article id="impressum">
              <h2 className={styles.heading}>{dict.impressum.title}</h2>
              <dl className={styles.facts}>
                {dict.impressum.rows.map((row) => (
                  <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>
                ))}
              </dl>
            </article>
            <article id="privacy">
              <h2 className={styles.heading}>{dict.privacy.title}</h2>
              {dict.privacy.blocks.map((block) => <LegalBlockRow key={block.title} {...block} />)}
            </article>
            <article id="terms">
              <h2 className={styles.heading}>{dict.terms.title}</h2>
              <p className={`${styles.note} ${styles.revision}`}>{common.lastRevisionApr2026}</p>
              {dict.terms.blocks.map((block) => <LegalBlockRow key={block.title} {...block} />)}
            </article>
            <p className={`${styles.note} ${styles.end}`}>{common.endOfDocument.replace("{year}", String(year))}</p>
          </div>
        </div>
      </div>
    </>
  );
}

function LegalBlockRow({ title, body }: LegalBlock) {
  return (
    <div className={styles.block}>
      <h3 className={styles.subheading}>{title}</h3>
      <p className={styles.body}>{body}</p>
    </div>
  );
}
