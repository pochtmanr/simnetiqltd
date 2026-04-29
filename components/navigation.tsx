"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { localizePath, type Locale } from "@/lib/i18n";

type NavDict = {
  links: {
    home: string;
    projects: string;
    services: string;
    about: string;
    legal: string;
  };
  rail: {
    online: string;
    operations: string;
  };
  languageLabel: string;
  themeLabel: string;
  themes: {
    dark: string;
    light: string;
    toggle: string;
  };
};

const linkDefs = [
  { key: "home", href: "/", code: "00" },
  { key: "projects", href: "/projects", code: "01" },
  { key: "services", href: "/services", code: "02" },
  { key: "about", href: "/about", code: "03" },
  { key: "legal", href: "/legal", code: "04" },
] as const;

export function Navigation({
  locale,
  dict,
}: {
  locale: Locale;
  dict: NavDict;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [clock, setClock] = useState("—");

  useEffect(() => {
    function tick() {
      const d = new Date();
      const utc = `${String(d.getUTCHours()).padStart(2, "0")}:${String(
        d.getUTCMinutes()
      ).padStart(2, "0")}:${String(d.getUTCSeconds()).padStart(2, "0")} UTC`;
      setClock(utc);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const links = linkDefs.map((l) => ({
    ...l,
    href: localizePath(locale, l.href),
    label: dict.links[l.key],
  }));

  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--color-bg)_85%,transparent)] bg-[var(--color-bg)]">
      {/* Technical top rail */}
      <div className="border-b border-[var(--color-border)] text-[var(--color-text-dim)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
          <div className="flex items-center justify-between h-7 font-[family-name:var(--font-mono)] text-[10.5px] tracking-[0.18em] uppercase">
            <div className="flex items-center gap-3 sm:gap-6">
              <span className="flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary-glow)] pulse-dot" />
                {dict.rail.online}
              </span>
              <span className="hidden sm:inline">51.5074°N · 0.1278°W</span>
              <span className="hidden md:inline">{dict.rail.operations}</span>
            </div>
            <div className="flex items-center gap-3 sm:gap-6">
              <LocaleSwitcher current={locale} className="hidden md:flex" />
              <ThemeToggle className="hidden md:inline-flex" />
              <span suppressHydrationWarning>{clock}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
          <div className="flex h-16 items-center justify-between">
            <Link href={localizePath(locale, "/")} className="flex items-center gap-3">
              <Logo className="h-5 w-auto" />
              <span className="text-label text-[var(--color-text)]">SIMNETIQ</span>
            </Link>

            {/* Desktop */}
            <div className="hidden md:flex items-center gap-10">
              {links.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group inline-flex items-center gap-2 text-label-sm transition-colors duration-150"
                  >
                    <span
                      className={
                        active
                          ? "text-[var(--color-primary-glow)]"
                          : "text-[var(--color-text-faint)]"
                      }
                    >
                      {link.code}
                    </span>
                    <span
                      className={
                        active
                          ? "text-[var(--color-text)]"
                          : "text-[var(--color-text-dim)] group-hover:text-[var(--color-text)]"
                      }
                    >
                      {link.label.toUpperCase()}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden flex flex-col gap-[5px] p-2"
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              <span
                className={`block w-5 h-[1px] bg-[var(--color-text)] transition-transform duration-150 origin-center ${
                  open ? "rotate-45 translate-y-[6px]" : ""
                }`}
              />
              <span
                className={`block w-5 h-[1px] bg-[var(--color-text)] transition-opacity duration-150 ${
                  open ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block w-5 h-[1px] bg-[var(--color-text)] transition-transform duration-150 origin-center ${
                  open ? "-rotate-45 -translate-y-[6px]" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-[var(--color-border)]">
            <div className="px-6 py-5 flex flex-col gap-4">
              {links.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-[var(--color-text-faint)] text-label-sm">
                        {link.code}
                      </span>
                      <span
                        className={`text-label ${
                          active
                            ? "text-[var(--color-text)]"
                            : "text-[var(--color-text-dim)]"
                        }`}
                      >
                        {link.label.toUpperCase()}
                      </span>
                    </span>
                    <span
                      className={`text-label ${
                        active
                          ? "text-[var(--color-primary-glow)]"
                          : "text-[var(--color-text-faint)]"
                      } btn-arrow`}
                    >
                      →
                    </span>
                  </Link>
                );
              })}
              <div className="mt-2 pt-5 border-t border-[var(--color-border)] space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-label-sm text-[var(--color-text-faint)]">
                    ▸ {dict.languageLabel}
                  </p>
                  <LocaleSwitcher current={locale} variant="segmented" />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-label-sm text-[var(--color-text-faint)]">
                    ▸ {dict.themeLabel}
                  </p>
                  <ThemeToggle
                    variant="segmented"
                    labels={{
                      dark: dict.themes.dark,
                      light: dict.themes.light,
                      generic: dict.themes.toggle,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
