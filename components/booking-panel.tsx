"use client";

import { useEffect, useMemo, useState } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import styles from "./contact-section.module.css";
import { track } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";

type BookingPanelProps = {
  locale: Locale;
  loadingLabel: string;
  timezoneLabel: string;
};

type CalTheme = "dark" | "light";

function readContactTheme(): CalTheme {
  if (typeof document === "undefined") return "light";
  const resolved = document.documentElement.getAttribute("data-theme");
  if (resolved === "light") return "dark";
  if (resolved === "dark") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "light" : "dark";
}

const SIMNETIQ_DARK_VARS = {
  "cal-brand": "#EBEBEB",
  "cal-brand-emphasis": "#FFFFFF",
  "cal-brand-text": "#07090D",
  "cal-bg": "#07090D",
  "cal-bg-muted": "#0F1115",
  "cal-bg-emphasis": "#151821",
  "cal-bg-subtle": "#0A0A0B",
  "cal-bg-info": "#0F1115",
  "cal-bg-success": "#0F1115",
  "cal-bg-attention": "#0F1115",
  "cal-bg-error": "#1a0a0a",
  "cal-text": "#EBEBEB",
  "cal-text-emphasis": "#FFFFFF",
  "cal-text-muted": "#ABABAC",
  "cal-text-subtle": "#787878",
  "cal-border-emphasis": "rgba(255,255,255,0.28)",
  "cal-border": "rgba(255,255,255,0.18)",
  "cal-border-subtle": "rgba(255,255,255,0.08)",
  "cal-border-booker": "rgba(255,255,255,0.18)",
};

const SIMNETIQ_LIGHT_VARS = {
  "cal-brand": "#0A0A0B",
  "cal-brand-emphasis": "#303034",
  "cal-brand-text": "#FFFFFF",
  "cal-bg": "#FFFFFF",
  "cal-bg-muted": "#FAFAFC",
  "cal-bg-emphasis": "#ECEEF2",
  "cal-bg-subtle": "#F4F5F7",
  "cal-bg-info": "#F4F5F7",
  "cal-bg-success": "#F4F5F7",
  "cal-bg-attention": "#F4F5F7",
  "cal-bg-error": "#fdf0ee",
  "cal-text": "#0A0A0B",
  "cal-text-emphasis": "#000000",
  "cal-text-muted": "#3A3A3C",
  "cal-text-subtle": "#6E6E70",
  "cal-border-emphasis": "rgba(0,0,0,0.32)",
  "cal-border": "rgba(0,0,0,0.22)",
  "cal-border-subtle": "rgba(0,0,0,0.10)",
  "cal-border-booker": "rgba(0,0,0,0.22)",
};

export function BookingPanel({ locale, loadingLabel, timezoneLabel }: BookingPanelProps) {
  // Initialize lazily from the DOM so the very first render already carries
  // the contact section’s inverse theme. Cal's removeChild crashes are tied to its
  // internal cleanup running on a config-driven re-render right after mount.
  // ThemeProvider's pre-paint inline script has already written data-theme and
  // data-theme-choice before hydration, so this initializer sees the final
  // value and the effect below only has to subscribe to later changes.
  const [theme, setTheme] = useState<CalTheme>(() => readContactTheme());
  const [tz] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [loadedTheme, setLoadedTheme] = useState<CalTheme | null>(null);
  const calLink = process.env.NEXT_PUBLIC_CAL_LINK ?? "simnetiq/30min";
  const configuredOrigin = process.env.NEXT_PUBLIC_CAL_ORIGIN ?? "https://cal.eu";
  // Use the EU booking host directly, avoiding its bare-domain redirect.
  const calOrigin = configuredOrigin.replace(/^https:\/\/(www\.)?cal\.eu\/?$/, "https://www.cal.eu");
  const embedJsUrl =
    process.env.NEXT_PUBLIC_CAL_EMBED_JS_URL ?? "https://app.cal.eu/embed/embed.js";

  useEffect(() => {
    const html = document.documentElement;
    const obs = new MutationObserver(() => {
      const next = readContactTheme();
      setTheme((prev) => (prev === next ? prev : next));
    });
    obs.observe(html, {
      attributes: true,
      attributeFilter: ["data-theme", "data-theme-choice"],
    });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void getCalApi({ embedJsUrl }).then((cal) => {
      if (cancelled) return;
      const applyTheme = () => cal("ui", {
        theme,
        hideEventTypeDetails: true,
        layout: "month_view",
        styles: {
          body: { background: theme === "dark" ? "#07090D" : "#FFFFFF" },
          branding: { brandColor: theme === "dark" ? "#EBEBEB" : "#0A0A0B" },
        },
        cssVarsPerTheme: { light: SIMNETIQ_LIGHT_VARS, dark: SIMNETIQ_DARK_VARS },
      });
      const onReady = () => {
        applyTheme();
        setLoadedTheme(theme);
        track("booking_widget_loaded", { locale, tz_hint: tz });
      };
      const onBooked = () => track("booking_completed", { locale, tz, event_type: calLink.split("/").pop() ?? "30min" });
      cal("on", { action: "linkReady", callback: onReady });
      cal("on", { action: "bookingSuccessfulV2", callback: onBooked });
      applyTheme();
      cleanup = () => {
        cal("off", { action: "linkReady", callback: onReady });
        cal("off", { action: "bookingSuccessfulV2", callback: onBooked });
      };
    });
    return () => { cancelled = true; cleanup?.(); };
  }, [locale, tz, theme, embedJsUrl, calLink]);

  // Memoize style + config so Cal sees a stable prop reference between
  // renders. New object identities trigger Cal's internal cleanup path,
  // which has bitten us with React 19's "removeChild" on null.
  const calStyle = useMemo<React.CSSProperties>(
    () => ({ width: "100%", minHeight: 390, overflow: "hidden" }),
    [],
  );
  const calConfig = useMemo(
    () => ({ layout: "month_view" as const, theme, timeZone: tz }),
    [theme, tz],
  );

  return (
    <>
      <p className={styles.timezone}>{timezoneLabel} <bdi>{tz.replaceAll("_", " ")}</bdi></p>
      <div className={styles.calendarEmbed}>
        <Cal
          // Force a clean unmount/mount whenever the resolved theme changes
          // instead of letting Cal hot-swap config — the latter is the path
          // that produces the React 19 removeChild crash.
          key={`${theme}-${tz}`}
          calLink={calLink}
          calOrigin={calOrigin}
          embedJsUrl={embedJsUrl}
          style={calStyle}
          config={calConfig}
        />
        {loadedTheme !== theme && <div className={`${styles.loading} ${styles.loadingOverlay}`} role="status"><span aria-hidden="true" />{loadingLabel}</div>}
      </div>
    </>
  );
}
