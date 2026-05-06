"use client";

import { Rail } from "@/components/panel";
import { ServiceCard } from "@/components/service-card";
import { MobileBg } from "@/components/service-bg/mobile";
import { WebBg } from "@/components/service-bg/web";
import { AiBg } from "@/components/service-bg/ai";
import { GrowthBg } from "@/components/service-bg/growth";
import { AutomationsBg } from "@/components/service-bg/automations";
import type { Locale } from "@/lib/i18n";

type CapKey = "mobile" | "web" | "ai" | "growth" | "automations";

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
  { key: "ai", code: "C-03", href: "/services/ai-integration", bg: () => <AiBg /> },
  { key: "growth", code: "C-04", href: "/services/growth-marketing", bg: () => <GrowthBg /> },
  { key: "automations", code: "C-05", href: "/services", bg: () => <AutomationsBg /> },
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
    <section id="services" className="scroll-mt-24 border-b border-[var(--color-border)]">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-24">
        <Rail items={["§ 02", caps.title, subtitle]} className="mb-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-10 lg:mb-14">
          <div className="lg:col-span-4">
            <p className="text-label text-[var(--color-primary-glow)]">
              {caps.eyebrow}
            </p>
            <h2 className="text-headline mt-5">{caps.title}</h2>
          </div>
          <div className="lg:col-span-6 lg:col-start-7 self-end">
            <p className="text-body max-w-md">{subtitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
          {CARDS.map((card, i) => {
            const meta = caps.items[card.key];
            const isLast = i === CARDS.length - 1;
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
                className={isLast ? "xl:col-span-1 md:col-span-2 xl:col-start-2" : ""}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
