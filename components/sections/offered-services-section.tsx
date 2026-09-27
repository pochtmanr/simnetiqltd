"use client";

import { ServiceCard } from "@/components/service-card";
import type { Locale } from "@/lib/i18n";
import styles from "./landing-sections.module.css";

type CapKey = "mobile" | "web" | "aiAutomation";

type CapDict = {
  eyebrow: string;
  title: string;
  body: string;
  subtitle?: string;
  viewService: string;
  items: Record<CapKey, { title: string; text: string }>;
};

type SectionDict = {
  capabilities: CapDict;
};

const CARDS: { key: CapKey; href: string }[] = [
  { key: "mobile", href: "/services/mobile-desktop" },
  { key: "web", href: "/services/web-platforms" },
  { key: "aiAutomation", href: "/services/ai-automation" },
];

export function OfferedServicesSection({
  locale,
  dict,
}: {
  locale: Locale;
  dict: SectionDict;
}) {
  const caps = dict.capabilities;
  const subtitle = caps.subtitle ?? caps.body;
  return (
    <>
      <div className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{caps.title}</h2>
          <p className={styles.sectionDescription}>{subtitle}</p>
        </header>

        <div className={styles.serviceGrid}>
          {CARDS.map((card, i) => {
            const meta = caps.items[card.key];
            return (
              <ServiceCard
                key={card.key}
                code={card.key}
                title={meta.title}
                body={meta.text}
                href={card.href}
                locale={locale}
                index={i}
                cta={caps.viewService}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
