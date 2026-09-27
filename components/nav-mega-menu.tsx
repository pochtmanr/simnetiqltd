"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";
import styles from "@/components/site-chrome.module.css";
import { track } from "@/lib/analytics";

export type NavMegaItem = {
  key: string;
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
            /* Blur only — no tint. The panel carries its own surface, so the
               scrim just has to soften what is behind it, not dim the page. */
            className="hidden md:block fixed inset-x-0 bottom-0 top-16 z-30 backdrop-blur-[2px]"
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
            className="hidden md:block absolute left-0 right-0 top-[calc(100%-1px)] z-40 border-b border-[var(--color-border)] bg-[var(--color-bg)]"
          >
            <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-8 lg:py-10">
              <p className={styles.menuEyebrow}>
                {eyebrow}
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 lg:gap-x-10 gap-y-2">
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
                    className={`group ${styles.menuItem}`}
                  >
                    <div className={styles.menuItemHeading}>
                      <h3>{item.title}</h3>
                      <svg className="rtl-mirror" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path d={item.external ? "M7 17 17 7M7 7h10v10" : "M4 12h15m-6-6 6 6-6 6"} />
                      </svg>
                    </div>
                    {item.badge && <span className={styles.menuBadge}>{item.badge}</span>}
                    <p className={styles.menuDescription}>{item.body}</p>
                    <span className={styles.menuAction}>{cta}</span>
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
