"use client";

import { useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { track } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";

type ContactDisclosureProps = {
  heading: string;
  locale: Locale;
  children: ReactNode;
};

export function ContactDisclosure({
  heading,
  locale,
  children,
}: ContactDisclosureProps) {
  const [open, setOpen] = useState(false);
  const [hasFired, setHasFired] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next && !hasFired) {
        track("contact_form_disclosed", { locale });
        setHasFired(true);
      }
      return next;
    });
  };

  return (
    <div className="border-t border-[var(--color-border-strong)]">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="contact-form-panel"
        className="w-full flex items-center justify-between gap-4 py-4 text-left text-mono uppercase tracking-[0.18em] text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors focus:outline-none focus-visible:text-[var(--color-primary-glow)]"
      >
        <span>{heading}</span>
        <span
          aria-hidden="true"
          className="inline-flex items-center justify-center w-5 h-5 text-[var(--color-primary-glow)]"
          style={{
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
            transition: prefersReducedMotion
              ? "none"
              : "transform 0.32s ease-out",
          }}
        >
          <svg
            viewBox="0 0 16 16"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          >
            <line x1="8" y1="2" x2="8" y2="14" />
            <line x1="2" y1="8" x2="14" y2="8" />
          </svg>
        </span>
      </button>
      <motion.div
        id="contact-form-panel"
        role="region"
        aria-hidden={!open}
        initial={false}
        animate={{
          height: open ? "auto" : 0,
          opacity: open ? 1 : 0,
        }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.32,
          ease: "easeOut",
        }}
        style={{ overflow: "hidden" }}
      >
        <div className="pt-4 pb-1">{children}</div>
      </motion.div>
    </div>
  );
}
