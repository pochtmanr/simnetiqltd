"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Panel } from "@/components/panel";
import { ScrollReveal } from "@/components/scroll-reveal";
import { track } from "@/lib/analytics";
import { localizePath, type Locale } from "@/lib/i18n";

type ServiceCode = "mobile" | "web" | "aiAutomation" | "growth";

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
        <Panel innerClassName="p-6 lg:p-7 h-full" hover>
          <div className="flex items-stretch gap-5 lg:gap-7 h-full">
            {/* Left: text column */}
            <div className="relative z-[1] flex flex-1 min-w-0 flex-col">
              <div className="flex items-center justify-between mb-5">
                <span className="text-mono text-[var(--color-text-faint)]">
                  {badge}
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary-glow)]" />
              </div>
              <h3 className="text-title mb-3">{title}</h3>
              <p className="text-body mb-6 flex-1">{body}</p>
              {/* Mobile: pre-filled, full-width — no hover state available */}
              <span className="md:hidden text-label-sm !text-white flex w-full items-center justify-between gap-1.5 px-3 py-2.5 bg-[var(--color-primary)]">
                <span>{cta}</span>
                <span aria-hidden="true" className="rtl-mirror">
                  →
                </span>
              </span>
              {/* Desktop: slide-fill on hover */}
              <span className="cta-fill text-label-sm self-start hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-[var(--color-text-dim)] transition-colors duration-300 group-hover:text-white">
                <span>{cta}</span>
                <span aria-hidden="true" className="rtl-mirror">
                  →
                </span>
              </span>
            </div>

            {/* Right: 1:1 square frame with corners + service SVG (desktop only) */}
            <div className="relative aspect-square shrink-0 w-[38%] max-w-[260px] self-center hidden md:block">
              <div
                aria-hidden="true"
                className="corners pointer-events-none absolute inset-0"
              >
                <span className="corner tl" />
                <span className="corner tr" />
                <span className="corner bl" />
                <span className="corner br" />
              </div>
              <div className="absolute inset-2 flex items-center justify-center">
                {background}
              </div>
            </div>
          </div>
        </Panel>
      </Link>
    </ScrollReveal>
  );
}
