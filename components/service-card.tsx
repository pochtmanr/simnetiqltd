"use client";

import Link from "next/link";
import { useRef } from "react";
import { useInView } from "motion/react";
import { ScrollReveal } from "@/components/scroll-reveal";
import { CardArrow } from "@/components/sections/card-arrow";
import styles from "@/components/sections/landing-sections.module.css";
import { track } from "@/lib/analytics";
import { localizePath, type Locale } from "@/lib/i18n";

import { ServiceFigure, type ServiceCode } from "@/components/service-figure";

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
  const figureRef = useRef<HTMLDivElement>(null);
  const figureVisible = useInView(figureRef);

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
        className={styles.serviceCard}
        onClick={() => track("service_card_click", { service: code, locale })}
      >
        <div className={styles.serviceTop} aria-hidden="true">
          <span className={styles.number}>0{index + 1}</span>
          <div ref={figureRef} className={styles.dotFigureMotion} data-visible={figureVisible} style={{ animationDelay: `${index * -2}s` }}>
            <ServiceFigure code={code} className={styles.dotFigure} />
          </div>
        </div>
        <h3 className="text-title mb-4">{title}</h3>
        <p className="text-body mb-8 flex-1">{body}</p>
        <span className={styles.serviceCta}>
          <span>{cta}</span>
          <CardArrow />
        </span>
      </Link>
    </ScrollReveal>
  );
}
