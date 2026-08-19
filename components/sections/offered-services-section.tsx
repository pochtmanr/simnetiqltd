"use client";

import { ServiceCard } from "@/components/service-card";
import type { Locale } from "@/lib/i18n";

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
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-10 lg:mb-14">
          <div className="lg:col-span-4">
            <h2 className="text-headline">{caps.title}</h2>
          </div>
          <div className="lg:col-span-6 lg:col-start-7 self-end">
            <p className="text-body max-w-md">{subtitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
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
