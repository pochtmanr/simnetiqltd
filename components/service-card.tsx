"use client";

import Link from "next/link";
import { Panel } from "@/components/panel";
import { ScrollReveal } from "@/components/scroll-reveal";
import { track } from "@/lib/analytics";
import { localizePath, type Locale } from "@/lib/i18n";

type ServiceCode = "mobile" | "web" | "aiAutomation";

type ServiceCardProps = {
  code: ServiceCode;
  title: string;
  body: string;
  href: string;
  locale: Locale;
  index: number;
  cta: string;
  className?: string;
};

export function ServiceCard({
  code,
  title,
  body,
  href,
  locale,
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
          <div className="flex h-full">
            <div className="relative z-[1] flex flex-1 min-w-0 flex-col">
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

          </div>
        </Panel>
      </Link>
    </ScrollReveal>
  );
}
