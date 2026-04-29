"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n";

const LOCALE_COOKIE = "NEXT_LOCALE";

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
          return (
            <Link
              key={locale}
              href={href}
              prefetch={false}
              hrefLang={locale}
              aria-current={active ? "true" : undefined}
              onClick={() => {
                if (typeof document !== "undefined") {
                  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
                }
              }}
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
    <div className={`flex items-center gap-1 ${className}`}>
      {LOCALES.map((locale, i) => {
        const active = locale === current;
        const href = pathForLocale(locale);
        return (
          <span key={locale} className="flex items-center gap-1">
            {i > 0 && (
              <span aria-hidden className="text-[var(--color-text-faint)]">
                ·
              </span>
            )}
            <Link
              href={href}
              prefetch={false}
              hrefLang={locale}
              aria-current={active ? "true" : undefined}
              onClick={() => {
                if (typeof document !== "undefined") {
                  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
                }
              }}
              className={
                active
                  ? "text-label-sm text-[var(--color-primary-glow)]"
                  : "text-label-sm text-[var(--color-text-faint)] hover:text-[var(--color-text)] transition-colors"
              }
            >
              {LOCALE_LABELS[locale]}
            </Link>
          </span>
        );
      })}
    </div>
  );
}
