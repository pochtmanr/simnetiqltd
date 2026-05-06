"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Panel } from "@/components/panel";
import { ScrollReveal } from "@/components/scroll-reveal";
import { track } from "@/lib/analytics";
import { localizePath, type Locale } from "@/lib/i18n";

type ServiceCode = "mobile" | "web" | "ai" | "growth" | "automations";

type ServiceCardProps = {
  code: ServiceCode;
  badge: string;
  title: string;
  body: string;
  href: string;
  locale: Locale;
  background: ReactNode;
  index: number;
  cta: string;
  className?: string;
};

export function ServiceCard({
  code,
  badge,
  title,
  body,
  href,
  locale,
  background,
  index,
  cta,
  className = "",
}: ServiceCardProps) {
  return (
    <ScrollReveal
      delay={index * 80}
      className={`group block h-full ${className}`}
      onViewportEnter={() =>
        track("service_card_view", { service: code, index, locale })
      }
    >
      <Link
        href={localizePath(locale, href)}
        className="block h-full"
        onClick={() => track("service_card_click", { service: code, locale })}
      >
        <Panel innerClassName="p-6 lg:p-7 h-full flex flex-col overflow-hidden" hover>
          {/* Animated background — masked so text stays readable */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: 0.18,
              maskImage:
                "radial-gradient(circle at 80% 80%, black 0%, transparent 75%)",
              WebkitMaskImage:
                "radial-gradient(circle at 80% 80%, black 0%, transparent 75%)",
            }}
          >
            {background}
          </div>

          <div className="relative z-[1] flex flex-col h-full">
            <div className="flex items-center justify-between mb-5">
              <span className="text-mono text-[var(--color-text-faint)]">
                {badge}
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary-glow)]" />
            </div>
            <h3 className="text-title mb-3">{title}</h3>
            <p className="text-body mb-6 flex-1">{body}</p>
            <span className="text-label-sm text-[var(--color-text-dim)] group-hover:text-[var(--color-primary-glow)] transition-colors inline-flex items-center gap-1.5">
              {cta}
              <span aria-hidden="true" className="rtl-mirror">
                →
              </span>
            </span>
          </div>
        </Panel>
      </Link>
    </ScrollReveal>
  );
}
