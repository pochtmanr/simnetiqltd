"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { Panel } from "@/components/panel";
import { track } from "@/lib/analytics";

export type NavMegaItem = {
  key: string;
  code: string;
  badge?: string;
  title: string;
  body: string;
  href: string;
  external?: boolean;
};

type NavMegaMenuProps = {
  open: boolean;
  name: "projects" | "services";
  eyebrow: string;
  cta: string;
  items: NavMegaItem[];
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClose: () => void;
};

export function NavMegaMenu({
  open,
  name,
  eyebrow,
  cta,
  items,
  onMouseEnter,
  onMouseLeave,
  onClose,
}: NavMegaMenuProps) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key={`${name}-backdrop`}
            className="fixed inset-x-0 bottom-0 top-[91px] z-30 bg-black/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.15, ease: "easeOut" }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            key={`${name}-panel`}
            id={`nav-mega-${name}`}
            role="region"
            aria-label={eyebrow}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            initial={{ opacity: 0, y: reduce ? 0 : -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -8 }}
            transition={{ duration: reduce ? 0 : 0.18, ease: "easeOut" }}
            className="absolute left-0 right-0 top-full z-40 border-b border-[var(--color-border)] backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--color-bg)_92%,transparent)] bg-[var(--color-bg)]"
          >
            <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-6 lg:py-8">
              <p className="text-label text-[var(--color-primary-glow)] mb-5">
                {eyebrow}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
                {items.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    onClick={() => {
                      track("nav_dropdown_card_click", {
                        menu: name,
                        item: item.key,
                      });
                      onClose();
                    }}
                    className="group block h-full"
                  >
                    <Panel
                      innerClassName="p-5 lg:p-6 h-full flex flex-col overflow-hidden"
                      hover
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-mono text-[var(--color-text-faint)]">
                          {item.code}
                        </span>
                        {item.badge && (
                          <span className="text-label-sm text-[var(--color-primary-glow)]">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="text-title mb-2">{item.title}</h3>
                      <p className="text-body mb-5 flex-1 line-clamp-2">
                        {item.body}
                      </p>
                      <span className="cta-fill text-label-sm self-start inline-flex items-center gap-1.5 px-3 py-2 text-[var(--color-text-dim)] transition-colors duration-300 group-hover:text-white">
                        <span>{cta}</span>
                        <span aria-hidden="true" className="rtl-mirror">
                          {item.external ? "↗" : "→"}
                        </span>
                      </span>
                    </Panel>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
