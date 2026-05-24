"use client";

import { Rail } from "@/components/panel";
import { ServiceCard } from "@/components/service-card";
import { TextReveal } from "@/components/text-reveal";
import { MobileBg } from "@/components/service-bg/mobile";
import { WebBg } from "@/components/service-bg/web";
import { AutomationsBg } from "@/components/service-bg/automations";
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

const CARDS: { key: CapKey; code: string; href: string; bg: () => React.ReactElement }[] = [
  { key: "mobile", code: "C-01", href: "/services/mobile-desktop", bg: () => <MobileBg /> },
  { key: "web", code: "C-02", href: "/services/web-platforms", bg: () => <WebBg /> },
  { key: "aiAutomation", code: "C-03", href: "/services/ai-automation", bg: () => <AutomationsBg /> },
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
        <Rail items={["§ 02", caps.title, subtitle]} className="mb-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-10 lg:mb-14">
          <div className="lg:col-span-4">
            <TextReveal
              as="p"
              className="text-label text-[var(--color-primary-glow)]"
              text={caps.eyebrow}
              step={25}
            />
            <TextReveal
              as="h2"
              className="text-headline mt-5"
              text={caps.title}
              step={35}
              delay={120}
            />
          </div>
          <div className="lg:col-span-6 lg:col-start-7 self-end">
            <p className="text-body max-w-md">{subtitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          {CARDS.map((card, i) => {
            const meta = caps.items[card.key];
            return (
              <ServiceCard
                key={card.code}
                code={card.key}
                badge={card.code}
                title={meta.title}
                body={meta.text}
                href={card.href}
                locale={locale}
                background={card.bg()}
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
