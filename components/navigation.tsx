"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavMegaMenu, type NavMegaItem } from "@/components/nav-mega-menu";
import { track } from "@/lib/analytics";
import { localizePath, type Locale } from "@/lib/i18n";

type ProjectKey = "physics" | "doppler" | "creator" | "delivery";
type CapKey = "mobile" | "web" | "aiAutomation" | "growth";

type NavDict = {
  links: {
    home: string;
    projects: string;
    services: string;
  };
  rail: {
    online: string;
    operations: string;
  };
  languageLabel: string;
  themeLabel: string;
  themes: {
    auto: string;
    dark: string;
    light: string;
    toggle: string;
  };
  dropdowns: {
    projects: {
      eyebrow: string;
      cta: string;
      items: Record<
        ProjectKey,
        { title: string; description: string; badge: string }
      >;
    };
    services: {
      eyebrow: string;
      cta: string;
      items: Record<CapKey, { title: string; text: string }>;
    };
  };
};

type DropdownName = "projects" | "services";

type NavLink = {
  key: "home" | "projects" | "services";
  href: string;
  code: string;
  dropdown?: DropdownName;
};

const linkDefs: readonly NavLink[] = [
  { key: "home", href: "/", code: "00" },
  { key: "projects", href: "/projects", code: "01", dropdown: "projects" },
  { key: "services", href: "/services", code: "02", dropdown: "services" },
];

// Internal hrefs for case studies live at /projects/{slug}; items without a
// dedicated case study link out to the live product instead.
const PROJECT_META: {
  key: ProjectKey;
  code: string;
  href: string;
  external: boolean;
}[] = [
  { key: "physics", code: "01", href: "/projects/physics-explained", external: false },
  { key: "doppler", code: "02", href: "/projects/doppler-vpn", external: false },
  { key: "creator", code: "03", href: "https://www.creatorai.art/en", external: true },
  { key: "delivery", code: "04", href: "https://www.isrshipping.com", external: true },
];

const SERVICE_META: { key: CapKey; code: string; href: string }[] = [
  { key: "mobile", code: "C-01", href: "/services/mobile-desktop" },
  { key: "web", code: "C-02", href: "/services/web-platforms" },
  { key: "aiAutomation", code: "C-03", href: "/services/ai-automation" },
  { key: "growth", code: "C-04", href: "/services/growth-marketing" },
];

const HOVER_OPEN_DELAY = 100;
const HOVER_CLOSE_DELAY = 150;

export function Navigation({
  locale,
  dict,
}: {
  locale: Locale;
  dict: NavDict;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<DropdownName | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<DropdownName | null>(
    null,
  );
  const [clock, setClock] = useState("—");
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);

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

  // Close everything on route change. React 19 prefers deriving this during
  // render over a useEffect — synchronously closing avoids a flash of the
  // open menu on the new route.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setOpen(false);
    setOpenDropdown(null);
    setMobileExpanded(null);
  }

  const clearTimers = useCallback(() => {
    if (openTimer.current !== null) {
      window.clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleOpen = useCallback(
    (name: DropdownName) => {
      clearTimers();
      openTimer.current = window.setTimeout(() => {
        setOpenDropdown((prev) => {
          if (prev !== name) {
            track("nav_dropdown_open", { menu: name });
          }
          return name;
        });
      }, HOVER_OPEN_DELAY);
    },
    [clearTimers],
  );

  const scheduleClose = useCallback(() => {
    clearTimers();
    closeTimer.current = window.setTimeout(() => {
      setOpenDropdown(null);
    }, HOVER_CLOSE_DELAY);
  }, [clearTimers]);

  const closeNow = useCallback(() => {
    clearTimers();
    setOpenDropdown(null);
  }, [clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const links = linkDefs.map((l) => ({
    ...l,
    href: localizePath(locale, l.href),
    label: dict.links[l.key],
  }));

  const projectItems: NavMegaItem[] = useMemo(
    () =>
      PROJECT_META.map((p) => {
        const meta = dict.dropdowns.projects.items[p.key];
        return {
          key: p.key,
          code: p.code,
          badge: meta.badge,
          title: meta.title,
          body: meta.description,
          href: p.external ? p.href : localizePath(locale, p.href),
          external: p.external,
        };
      }),
    [dict.dropdowns.projects.items, locale],
  );

  const serviceItems: NavMegaItem[] = useMemo(
    () =>
      SERVICE_META.map((s) => {
        const meta = dict.dropdowns.services.items[s.key];
        return {
          key: s.key,
          code: s.code,
          title: meta.title,
          body: meta.text,
          href: localizePath(locale, s.href),
        };
      }),
    [dict.dropdowns.services.items, locale],
  );

  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--color-bg)_85%,transparent)] bg-[var(--color-bg)]">
      {/* Technical top rail — status + clock only */}
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
            <span suppressHydrationWarning>{clock}</span>
          </div>
        </div>
      </div>

      {/* Main nav — bottom border belongs to the bar in its resting state, but
          when a mega-menu opens we hide it so the nav and dropdown panel read
          as one continuous surface (the panel carries its own bottom border). */}
      <nav
        className={`relative border-b ${
          openDropdown ? "border-transparent" : "border-[var(--color-border)]"
        }`}
      >
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
          <div className="flex h-16 items-center justify-between gap-6">
            <Link
              href={localizePath(locale, "/")}
              className="flex items-center gap-3"
            >
              <Logo className="h-5 w-auto" />
              <span className="text-label text-[var(--color-text)]">SIMNETIQ</span>
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-10">
              {links.map((link) => {
                const active = pathname === link.href;
                const isDropdown = !!link.dropdown;
                const isOpen = isDropdown && openDropdown === link.dropdown;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group relative inline-flex items-center gap-2 text-label-sm transition-colors duration-150"
                    aria-haspopup={isDropdown ? "true" : undefined}
                    aria-expanded={isDropdown ? isOpen : undefined}
                    aria-controls={
                      isDropdown ? `nav-mega-${link.dropdown}` : undefined
                    }
                    onMouseEnter={
                      isDropdown
                        ? () => scheduleOpen(link.dropdown as DropdownName)
                        : undefined
                    }
                    onMouseLeave={isDropdown ? scheduleClose : undefined}
                    onFocus={
                      isDropdown
                        ? () => scheduleOpen(link.dropdown as DropdownName)
                        : undefined
                    }
                  >
                    <span
                      className={
                        active || isOpen
                          ? "text-[var(--color-primary-glow)]"
                          : "text-[var(--color-text-faint)]"
                      }
                    >
                      {link.code}
                    </span>
                    <span
                      className={
                        active || isOpen
                          ? "text-[var(--color-text)]"
                          : "text-[var(--color-text-dim)] group-hover:text-[var(--color-text)]"
                      }
                    >
                      {link.label.toUpperCase()}
                    </span>
                    {isDropdown && (
                      <span
                        aria-hidden="true"
                        className={`text-[10px] leading-none transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        } ${
                          isOpen
                            ? "text-[var(--color-primary-glow)]"
                            : "text-[var(--color-text-faint)]"
                        }`}
                      >
                        ▾
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Desktop right cluster: language + theme */}
            <div className="hidden md:flex items-center gap-5">
              <LocaleSwitcher current={locale} />
              <ThemeToggle
                labels={{
                  cycleToLight: dict.themes.light,
                  cycleToDark: dict.themes.dark,
                  cycleToSystem: dict.themes.auto,
                  generic: dict.themes.toggle,
                }}
              />
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

        {/* Desktop mega-menus */}
        <NavMegaMenu
          open={openDropdown === "projects"}
          name="projects"
          eyebrow={dict.dropdowns.projects.eyebrow}
          cta={dict.dropdowns.projects.cta}
          items={projectItems}
          onMouseEnter={clearTimers}
          onMouseLeave={scheduleClose}
          onClose={closeNow}
        />
        <NavMegaMenu
          open={openDropdown === "services"}
          name="services"
          eyebrow={dict.dropdowns.services.eyebrow}
          cta={dict.dropdowns.services.cta}
          items={serviceItems}
          onMouseEnter={clearTimers}
          onMouseLeave={scheduleClose}
          onClose={closeNow}
        />

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-[var(--color-border)]">
            <div className="px-6 py-5 flex flex-col gap-4">
              {links.map((link) => {
                const active = pathname === link.href;
                const isDropdown = !!link.dropdown;
                const expanded =
                  isDropdown && mobileExpanded === link.dropdown;
                const items =
                  link.dropdown === "projects"
                    ? projectItems
                    : link.dropdown === "services"
                      ? serviceItems
                      : [];
                return (
                  <div key={link.href} className="flex flex-col">
                    <div className="flex items-center justify-between">
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 flex-1"
                      >
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
                      </Link>
                      {isDropdown ? (
                        <button
                          type="button"
                          onClick={() =>
                            setMobileExpanded(
                              expanded ? null : (link.dropdown as DropdownName),
                            )
                          }
                          aria-expanded={expanded}
                          aria-label={`Toggle ${link.label}`}
                          className="p-2 -mr-2 text-[var(--color-text-faint)]"
                        >
                          <span
                            aria-hidden="true"
                            className={`inline-block text-label transition-transform duration-200 ${
                              expanded ? "rotate-180" : ""
                            }`}
                          >
                            ▾
                          </span>
                        </button>
                      ) : (
                        <span
                          className={`text-label ${
                            active
                              ? "text-[var(--color-primary-glow)]"
                              : "text-[var(--color-text-faint)]"
                          } btn-arrow`}
                        >
                          →
                        </span>
                      )}
                    </div>
                    {isDropdown && expanded && (
                      <ul className="mt-3 ms-6 ps-4 border-s border-[var(--color-border)] flex flex-col gap-3">
                        {items.map((item) => (
                          <li key={item.key}>
                            <Link
                              href={item.href}
                              target={item.external ? "_blank" : undefined}
                              rel={
                                item.external
                                  ? "noopener noreferrer"
                                  : undefined
                              }
                              onClick={() => {
                                if (link.dropdown) {
                                  track("nav_dropdown_card_click", {
                                    menu: link.dropdown,
                                    item: item.key,
                                  });
                                }
                                setOpen(false);
                              }}
                              className="flex items-baseline gap-3"
                            >
                              <span className="text-mono text-[var(--color-text-faint)]">
                                {item.code}
                              </span>
                              <span className="text-body-strong text-[var(--color-text)]">
                                {item.title}
                              </span>
                              <span
                                aria-hidden="true"
                                className="ms-auto text-[var(--color-primary-glow)] btn-arrow"
                              >
                                {item.external ? "↗" : "→"}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
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
                      auto: dict.themes.auto,
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
