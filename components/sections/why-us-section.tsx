"use client";

import Image from "next/image";
import Link from "next/link";
import { Rail } from "@/components/panel";
import { Panel } from "@/components/panel";
import { ScrollReveal } from "@/components/scroll-reveal";
import { TextReveal } from "@/components/text-reveal";
import { track } from "@/lib/analytics";
import { localizePath, type Locale } from "@/lib/i18n";

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
const CARDS: { key: WhyKey; code: string; image: string; href: string }[] = [
  {
    key: "people",
    code: "01",
    image: "/why-people.avif",
    href: "/how-we-work/work-directly-with-engineers",
  },
  {
    key: "scope",
    code: "02",
    image: "/why-scope.avif",
    href: "/how-we-work/fixed-price-scope",
  },
  {
    key: "ownership",
    code: "03",
    image: "/why-ownership.avif",
    href: "/how-we-work/code-ownership",
  },
  {
    key: "support",
    code: "04",
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
    <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
      <Rail items={["§ 03", w.title, w.body]} className="mb-10" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-10 lg:mb-14">
        <div className="lg:col-span-4">
          <TextReveal
            as="p"
            className="text-label text-[var(--color-primary-glow)]"
            text={w.eyebrow}
            step={25}
          />
          <TextReveal
            as="h2"
            className="text-headline mt-5"
            text={w.title}
            step={35}
            delay={120}
          />
        </div>
        <div className="lg:col-span-6 lg:col-start-7 self-end">
          <p className="text-body max-w-md">{w.body}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 lg:gap-6">
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
                className="block h-full"
                onClick={() =>
                  track("why_card_click", { card: card.key, locale })
                }
              >
                <Panel innerClassName="h-full flex flex-col" hover>
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <Image
                      src={card.image}
                      alt=""
                      fill
                      sizes="(min-width: 1280px) 320px, (min-width: 640px) 45vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6 lg:p-7">
                    <span className="text-mono text-[var(--color-text-faint)] mb-4">
                      {card.code}
                    </span>
                    <h3 className="text-title mb-3">{meta.title}</h3>
                    <p className="text-body mb-6 flex-1">{meta.text}</p>
                    {/* Mobile: pre-filled, full-width — no hover state available */}
                    <span className="md:hidden text-label-sm !text-white flex w-full items-center justify-between gap-1.5 px-3 py-2.5 bg-[var(--color-primary)]">
                      <span>{w.cta}</span>
                      <span aria-hidden="true" className="rtl-mirror">
                        →
                      </span>
                    </span>
                    {/* Desktop: slide-fill on hover */}
                    <span className="cta-fill text-label-sm self-start hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-[var(--color-text-dim)] transition-colors duration-300 group-hover:text-white">
                      <span>{w.cta}</span>
                      <span aria-hidden="true" className="rtl-mirror">
                        →
                      </span>
                    </span>
                  </div>
                </Panel>
              </Link>
            </ScrollReveal>
          );
        })}
      </div>
    </div>
  );
}
