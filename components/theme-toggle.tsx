"use client";

import { useEffect, useState } from "react";
import { useTheme, type Theme } from "@/components/theme-provider";

type Variant = "icon" | "segmented";

type ThemeToggleProps = {
  className?: string;
  variant?: Variant;
  labels?: {
    toLight?: string;
    toDark?: string;
    generic?: string;
    dark?: string;
    light?: string;
  };
};

const DEFAULT_LABELS = {
  toLight: "Switch to light theme",
  toDark: "Switch to dark theme",
  generic: "Toggle theme",
  dark: "Dark",
  light: "Light",
};

export function ThemeToggle({
  className = "",
  variant = "icon",
  labels: labelsProp,
}: ThemeToggleProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const { theme, setTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (variant === "segmented") {
    const options: { value: Theme; label: string }[] = [
      { value: "dark", label: labels.dark },
      { value: "light", label: labels.light },
    ];
    return (
      <div
        className={`inline-flex items-stretch border border-[var(--color-border-strong)] ${className}`}
        role="group"
        aria-label={labels.generic}
      >
        {options.map((opt, i) => {
          const active = mounted && theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              aria-pressed={mounted ? active : undefined}
              className={[
                "px-3 py-1.5 text-label-sm transition-colors",
                i > 0 ? "border-l border-[var(--color-border-strong)]" : "",
                active
                  ? "bg-[var(--color-primary)]/10 text-[var(--color-primary-glow)]"
                  : "text-[var(--color-text-dim)] hover:text-[var(--color-text)]",
              ].join(" ")}
              suppressHydrationWarning
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  const isDark = theme === "dark";
  const label = mounted ? (isDark ? labels.toLight : labels.toDark) : labels.generic;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center w-6 h-6 text-[var(--color-text-faint)] hover:text-[var(--color-text)] transition-colors ${className}`}
      suppressHydrationWarning
    >
      <span suppressHydrationWarning>
        {mounted ? (isDark ? <SunIcon /> : <MoonIcon />) : <SunIcon />}
      </span>
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="2.4" />
      <line x1="7" y1="0.8" x2="7" y2="2.4" />
      <line x1="7" y1="11.6" x2="7" y2="13.2" />
      <line x1="0.8" y1="7" x2="2.4" y2="7" />
      <line x1="11.6" y1="7" x2="13.2" y2="7" />
      <line x1="2.6" y1="2.6" x2="3.7" y2="3.7" />
      <line x1="10.3" y1="10.3" x2="11.4" y2="11.4" />
      <line x1="2.6" y1="11.4" x2="3.7" y2="10.3" />
      <line x1="10.3" y1="3.7" x2="11.4" y2="2.6" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11.8 8.4 A 5 5 0 1 1 5.6 2.2 a 4 4 0 0 0 6.2 6.2 z" />
    </svg>
  );
}
