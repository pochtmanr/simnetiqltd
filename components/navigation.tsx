"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavMegaMenu, type NavMegaItem } from "@/components/nav-mega-menu";
import styles from "@/components/site-chrome.module.css";
import { track } from "@/lib/analytics";
import { localizePath, LOCALE_LABELS, type Locale } from "@/lib/i18n";

type ProjectKey = "argus" | "physics" | "doppler" | "creator" | "delivery";
type CapKey = "mobile" | "web" | "aiAutomation";

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
  dropdown?: DropdownName;
};

const linkDefs: readonly NavLink[] = [
  { key: "home", href: "/" },
  { key: "projects", href: "/projects", dropdown: "projects" },
  { key: "services", href: "/services", dropdown: "services" },
];

// Internal hrefs for case studies live at /projects/{slug}; items without a
// dedicated case study link out to the live product instead.
const PROJECT_META: {
  key: ProjectKey;
  href: string;
  external: boolean;
}[] = [
  { key: "argus", href: "/projects/argus-browser", external: false },
  { key: "physics", href: "/projects/physics-explained", external: false },
  { key: "doppler", href: "/projects/doppler-vpn", external: false },
  { key: "creator", href: "https://www.creatorai.art/en", external: true },
  { key: "delivery", href: "https://www.isrshipping.com", external: true },
];

const SERVICE_META: { key: CapKey; href: string }[] = [
  { key: "mobile", href: "/services/mobile-desktop" },
  { key: "web", href: "/services/web-platforms" },
  { key: "aiAutomation", href: "/services/ai-automation" },
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const settingsButton = useRef<HTMLButtonElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [openDropdown, setOpenDropdown] = useState<DropdownName | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<DropdownName | null>(
    null,
  );
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);

  // Close everything on route change. React 19 prefers deriving this during
  // render over a useEffect — synchronously closing avoids a flash of the
  // open menu on the new route.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setOpen(false);
    setSettingsOpen(false);
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
      setSettingsOpen(false);
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

  useEffect(() => {
    if (!settingsOpen) return;
    const dismiss = (event: PointerEvent) => {
      if (!settingsRef.current?.contains(event.target as Node)) setSettingsOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [settingsOpen]);

  useEffect(() => {
    if (!open) return;
    const query = window.matchMedia("(max-width: 767px)");
    const previous = document.body.style.overflow;
    const sync = () => {
      document.body.style.overflow = query.matches ? "hidden" : previous;
      if (!query.matches) setOpen(false);
    };
    sync();
    query.addEventListener("change", sync);
    return () => {
      document.body.style.overflow = previous;
      query.removeEventListener("change", sync);
    };
  }, [open]);

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
          title: meta.title,
          body: meta.text,
          href: localizePath(locale, s.href),
        };
      }),
    [dict.dropdowns.services.items, locale],
  );

  return (
    /* data-menu-open force-exits the transparent-over-hero state: the
       mega-menu and the mobile panel are opaque --color-bg surfaces, so they
       must never hang off a see-through bar, and their contents must not
       inherit the overlay's white text. */
    <header
      data-site-header=""
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) closeNow();
      }}
      onKeyDown={(event) => {
        if (event.key === "Tab" && open) {
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')).filter((element) => element.getClientRects().length > 0);
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
        if (event.key === "Escape") {
          closeNow();
          if (settingsOpen) {
            setSettingsOpen(false);
            settingsButton.current?.focus();
          } else {
            setOpen(false);
            menuButton.current?.focus();
          }
        }
      }}
      data-menu-open={openDropdown || open || settingsOpen ? "" : undefined}
      className={`sticky top-0 z-40 bg-[var(--color-bg)] ${
        openDropdown
          ? ""
          : "backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--color-bg)_85%,transparent)]"
      }`}
    >
      {/* Main nav — bottom border belongs to the bar in its resting state, but
          when a mega-menu opens we hide it so the nav and dropdown panel read
          as one continuous surface (the panel carries its own bottom border). */}
      <nav
        className={`relative ${
          openDropdown ? "" : "border-b border-[var(--color-border)]"
        }`}
      >
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
          <div className="flex h-16 items-center justify-between gap-6">
            <Link
              href={localizePath(locale, "/")}
              className={`flex items-center gap-3 ${styles.brand}`}
            >
              <Logo className="h-5 w-auto" />
              <span className="text-label text-[var(--color-text)]">SIMNETIQ</span>
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-2 lg:gap-4">
              {links.map((link) => {
                const active = pathname === link.href || (link.key !== "home" && pathname.startsWith(`${link.href}/`));
                const isDropdown = !!link.dropdown;
                const isOpen = isDropdown && openDropdown === link.dropdown;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`group relative inline-flex items-center gap-2 ${styles.navLink}`}
                    aria-current={active ? "page" : undefined}
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
                          ? "text-[var(--color-text)]"
                          : "text-[var(--color-text-dim)] group-hover:text-[var(--color-text)]"
                      }
                    >
                      {link.label}
                    </span>
                    {isDropdown && (
                      <span
                        aria-hidden="true"
                        className={`text-[10px] leading-none transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        } ${
                          isOpen
                            ? "text-[var(--color-text)]"
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

            <div className="flex items-center gap-3">
              <div ref={settingsRef} className={styles.settings} onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setSettingsOpen(false);
              }}>
                <button
                  ref={settingsButton}
                  type="button"
                  className={styles.settingsToggle}
                  aria-label={`${dict.languageLabel} / ${dict.themeLabel}`}
                  aria-expanded={settingsOpen}
                  aria-controls="navigation-settings"
                  onClick={() => { closeNow(); setSettingsOpen(!settingsOpen); }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" />
                  </svg>
                  <span className="hidden md:inline">{LOCALE_LABELS[locale]}</span>
                  <span aria-hidden="true">{settingsOpen ? "−" : "+"}</span>
                </button>
                {settingsOpen && (
                  <div id="navigation-settings" className={styles.settingsPanel}>
                    <p className={styles.settingsLabel}>{dict.languageLabel}</p>
                    <LocaleSwitcher current={locale} label={dict.languageLabel} className={styles.languageOptions} />
                    <div className={styles.themeSettings}>
                      <p className={styles.settingsLabel}>{dict.themeLabel}</p>
                      <ThemeToggle variant="segmented" className={styles.themeOptions} labels={{ auto: dict.themes.auto, dark: dict.themes.dark, light: dict.themes.light, generic: dict.themes.toggle }} />
                    </div>
                  </div>
                )}
              </div>

            {/* Mobile hamburger */}
            <button
              ref={menuButton}
              onClick={() => { setOpen(!open); setSettingsOpen(false); }}
              className={`md:hidden flex flex-col gap-[5px] ${styles.menuToggle}`}
              aria-label="Toggle menu"
              aria-controls="mobile-navigation"
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
          <div id="mobile-navigation" className={`md:hidden border-t border-[var(--color-border)] ${styles.mobileMenu}`}>
            <div className={styles.mobileInner}>
              {links.map((link) => {
                const active = pathname === link.href || (link.key !== "home" && pathname.startsWith(`${link.href}/`));
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
                  <div key={link.href} className={styles.mobileRow}>
                    <div className="flex items-center justify-between">
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 flex-1 ${styles.mobileLink}`}
                        aria-current={active ? "page" : undefined}
                      >
                        <span
                          className={`${styles.mobileLabel} ${
                            active
                              ? "text-[var(--color-text)]"
                              : "text-[var(--color-text-dim)]"
                          }`}
                        >
                          {link.label}
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
                          className="flex h-11 w-11 items-center justify-center text-[var(--color-text-dim)]"
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
                              ? "text-[var(--color-text)]"
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
                              className="flex min-h-11 items-center gap-3"
                            >
                              <span className="text-body-strong text-[var(--color-text)]">
                                {item.title}
                              </span>
                              <span
                                aria-hidden="true"
                                className="ms-auto text-[var(--color-text-dim)] btn-arrow"
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
              <div className={styles.mobileWordmark} aria-hidden="true">SIMNETIQ</div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
