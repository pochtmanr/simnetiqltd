"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n";

const LOCALE_COOKIE = "NEXT_LOCALE";

// Short, navbar-friendly labels. The Hebrew label is rendered with the same
// Lunasima face the rest of the RTL site uses, so it never falls back to a
// system Hebrew font in LTR contexts.
const LOCALE_SHORT: Record<Locale, string> = {
  en: "EN",
  he: "עב",
};

const HEBREW_FONT_STACK =
  'var(--font-lunasima), "Lunasima", ui-sans-serif, system-ui, sans-serif';

type Variant = "compact" | "segmented";

export function LocaleSwitcher({
  current,
  className = "",
  variant = "compact",
}: {
  current: Locale;
  className?: string;
  variant?: Variant;
}) {
  const pathname = usePathname() ?? "/";

  function pathForLocale(locale: Locale): string {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0 && (LOCALES as readonly string[]).includes(segments[0])) {
      segments[0] = locale;
    } else {
      segments.unshift(locale);
    }
    return `/${segments.join("/")}`;
  }

  if (variant === "segmented") {
    return (
      <div
        className={`inline-flex items-stretch border border-[var(--color-border-strong)] ${className}`}
        role="group"
        aria-label="Language"
      >
        {LOCALES.map((locale) => {
          const active = locale === current;
          const href = pathForLocale(locale);
          const isHebrew = locale === "he";
          return (
            <Link
              key={locale}
              href={href}
              prefetch={false}
              hrefLang={locale}
              lang={locale}
              aria-current={active ? "true" : undefined}
              onClick={() => {
                if (typeof document !== "undefined") {
                  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
                }
              }}
              style={isHebrew ? { fontFamily: HEBREW_FONT_STACK } : undefined}
              className={[
                "px-3 py-1.5 text-label-sm transition-colors",
                "border-l border-[var(--color-border-strong)] first:border-l-0",
                active
                  ? "bg-[var(--color-primary)]/10 text-[var(--color-primary-glow)]"
                  : "text-[var(--color-text-dim)] hover:text-[var(--color-text)]",
              ].join(" ")}
            >
              {LOCALE_LABELS[locale]}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase ${className}`}
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((locale, i) => {
        const active = locale === current;
        const href = pathForLocale(locale);
        const isHebrew = locale === "he";
        return (
          <span key={locale} className="flex items-center">
            {i > 0 && (
              <span
                aria-hidden
                className="mx-2 inline-block h-3 w-px bg-[var(--color-border-strong)]"
              />
            )}
            <Link
              href={href}
              prefetch={false}
              hrefLang={locale}
              lang={locale}
              aria-current={active ? "true" : undefined}
              title={LOCALE_LABELS[locale]}
              onClick={() => {
                if (typeof document !== "undefined") {
                  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
                }
              }}
              style={
                isHebrew
                  ? {
                      fontFamily: HEBREW_FONT_STACK,
                      letterSpacing: "0.05em",
                      fontSize: "12px",
                    }
                  : undefined
              }
              className={
                active
                  ? "text-[var(--color-primary-glow)] transition-colors"
                  : "text-[var(--color-text-faint)] hover:text-[var(--color-text)] transition-colors"
              }
            >
              {LOCALE_SHORT[locale]}
            </Link>
          </span>
        );
      })}
    </div>
  );
}
