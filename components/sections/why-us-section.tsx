"use client";

import Image from "next/image";
import Link from "next/link";
import { CardArrow } from "./card-arrow";
import { ScrollReveal } from "@/components/scroll-reveal";
import { track } from "@/lib/analytics";
import { localizePath, type Locale } from "@/lib/i18n";
import styles from "./landing-sections.module.css";

type WhyKey = "people" | "scope" | "ownership" | "support";

type WhyDict = {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  items: Record<WhyKey, { title: string; text: string }>;
};

/* Images are decorative — each card's title and body carry the meaning, so
   they render with an empty alt rather than a redundant description.
   `href` is unlocalized; localizePath adds the locale segment. */
const CARDS: { key: WhyKey; image: string; href: string }[] = [
  {
    key: "people",
    image: "/why-people.avif",
    href: "/how-we-work/work-directly-with-engineers",
  },
  {
    key: "scope",
    image: "/why-scope.avif",
    href: "/how-we-work/fixed-price-scope",
  },
  {
    key: "ownership",
    image: "/why-ownership.avif",
    href: "/how-we-work/code-ownership",
  },
  {
    key: "support",
    image: "/why-support.avif",
    href: "/how-we-work/support-after-launch",
  },
];

export function WhyUsSection({
  locale,
  dict,
}: {
  locale: Locale;
  dict: { whyUs: WhyDict };
}) {
  const w = dict.whyUs;
  return (
    <div className={styles.section}>
      <header className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{w.title}</h2>
        <p className={styles.sectionDescription}>{w.body}</p>
      </header>

      <div className={styles.whyGrid}>
        {CARDS.map((card, i) => {
          const meta = w.items[card.key];
          return (
            <ScrollReveal
              key={card.key}
              delay={i * 80}
              className="group block h-full"
              onViewportEnter={() =>
                track("why_card_view", { card: card.key, index: i, locale })
              }
            >
              <Link
                href={localizePath(locale, card.href)}
                className={styles.whyCard}
                onClick={() =>
                  track("why_card_click", { card: card.key, locale })
                }
              >
                  <div className={`${styles.whyImage} relative aspect-[4/3] w-full overflow-hidden`}>
                    <Image
                      src={card.image}
                      alt=""
                      fill
                      sizes="(min-width: 1280px) 320px, (min-width: 640px) 45vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <div className={styles.whyContent}>
                    <h3 className="text-title mb-3">{meta.title}</h3>
                    <p className="text-body mb-6 flex-1">{meta.text}</p>
                    <span className={styles.serviceCta}>
                      <span>{w.cta}</span>
                      <CardArrow />
                    </span>
                  </div>
              </Link>
            </ScrollReveal>
          );
        })}
      </div>
    </div>
  );
}
