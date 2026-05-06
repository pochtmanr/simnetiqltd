"use client";

import { useEffect, useMemo, useState } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { Panel } from "@/components/panel";
import { track } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";

type BookingPanelProps = {
  locale: Locale;
  dict?: unknown;
};

type CalTheme = "auto" | "dark" | "light";

function readSiteTheme(): CalTheme {
  if (typeof document === "undefined") return "auto";
  const choice = document.documentElement.getAttribute("data-theme-choice");
  if (choice === "light" || choice === "dark") return choice;
  const resolved = document.documentElement.getAttribute("data-theme");
  if (resolved === "light" || resolved === "dark") return resolved;
  return "auto";
}

const SIMNETIQ_DARK_VARS = {
  "--cal-brand": "#C8795D",
  "--cal-brand-emphasis": "#B2451E",
  "--cal-brand-text": "#FFFFFF",
  "--cal-bg": "#07090D",
  "--cal-bg-muted": "#0F1115",
  "--cal-bg-emphasis": "#151821",
  "--cal-bg-subtle": "#0A0A0B",
  "--cal-bg-info": "#0F1115",
  "--cal-bg-success": "#0F1115",
  "--cal-bg-attention": "#0F1115",
  "--cal-bg-error": "#1a0a0a",
  "--cal-text": "#EBEBEB",
  "--cal-text-emphasis": "#FFFFFF",
  "--cal-text-muted": "#ABABAC",
  "--cal-text-subtle": "#787878",
  "--cal-border-emphasis": "rgba(255,255,255,0.28)",
  "--cal-border": "rgba(255,255,255,0.18)",
  "--cal-border-subtle": "rgba(255,255,255,0.08)",
  "--cal-border-booker": "rgba(255,255,255,0.18)",
};

const SIMNETIQ_LIGHT_VARS = {
  "--cal-brand": "#C84F23",
  "--cal-brand-emphasis": "#8E3614",
  "--cal-brand-text": "#FFFFFF",
  "--cal-bg": "#FFFFFF",
  "--cal-bg-muted": "#FAFAFC",
  "--cal-bg-emphasis": "#ECEEF2",
  "--cal-bg-subtle": "#F4F5F7",
  "--cal-bg-info": "#F4F5F7",
  "--cal-bg-success": "#F4F5F7",
  "--cal-bg-attention": "#F4F5F7",
  "--cal-bg-error": "#fdf0ee",
  "--cal-text": "#0A0A0B",
  "--cal-text-emphasis": "#000000",
  "--cal-text-muted": "#3A3A3C",
  "--cal-text-subtle": "#6E6E70",
  "--cal-border-emphasis": "rgba(0,0,0,0.32)",
  "--cal-border": "rgba(0,0,0,0.22)",
  "--cal-border-subtle": "rgba(0,0,0,0.10)",
  "--cal-border-booker": "rgba(0,0,0,0.22)",
};

export function BookingPanel({ locale }: BookingPanelProps) {
  // Initialize lazily from the DOM so the very first render already carries
  // the resolved Simnetiq theme. Cal's removeChild crashes are tied to its
  // internal cleanup running on a config-driven re-render right after mount.
  const [theme, setTheme] = useState<CalTheme>(() => readSiteTheme());
  const tz = locale === "he" ? "Asia/Jerusalem" : "Europe/Berlin";
  const calLink = process.env.NEXT_PUBLIC_CAL_LINK ?? "simnetiq/30min";
  const calOrigin = process.env.NEXT_PUBLIC_CAL_ORIGIN ?? "https://cal.eu";
  const embedJsUrl =
    process.env.NEXT_PUBLIC_CAL_EMBED_JS_URL ?? "https://app.cal.eu/embed/embed.js";

  useEffect(() => {
    const html = document.documentElement;
    setTheme(readSiteTheme());
    const obs = new MutationObserver(() => {
      const next = readSiteTheme();
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
    (async () => {
      const cal = await getCalApi({ embedJsUrl });
      if (cancelled) return;

      cal("ui", {
        hideEventTypeDetails: false,
        layout: "month_view",
        cssVarsPerTheme: {
          light: SIMNETIQ_LIGHT_VARS,
          dark: SIMNETIQ_DARK_VARS,
        },
      });

      cal("on", {
        action: "linkReady",
        callback: () =>
          track("booking_widget_loaded", { locale, tz_hint: tz }),
      });
      cal("on", {
        action: "bookingSuccessful",
        callback: (e) => {
          const detail = (
            e as CustomEvent<{
              data?: {
                eventType?: { slug?: string };
              };
            }>
          ).detail;
          const slug = detail?.data?.eventType?.slug ?? "30min";
          track("booking_completed", { locale, tz, event_type: slug });
        },
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [locale, tz, embedJsUrl]);

  // Memoize style + config so Cal sees a stable prop reference between
  // renders. New object identities trigger Cal's internal cleanup path,
  // which has bitten us with React 19's "removeChild" on null.
  const calStyle = useMemo<React.CSSProperties>(
    () => ({ width: "100%", minHeight: 620, overflow: "hidden" }),
    [],
  );
  const calConfig = useMemo(
    () => ({ layout: "month_view" as const, theme, timeZone: tz }),
    [theme, tz],
  );

  return (
    <Panel className="overflow-hidden" innerClassName="p-0">
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
    </Panel>
  );
}
