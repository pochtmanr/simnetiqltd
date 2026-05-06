"use client";

import { useSyncExternalStore } from "react";
import { useTheme, type ThemeChoice } from "@/components/theme-provider";
import { track } from "@/lib/analytics";

const subscribe = () => () => {};
const getServerSnapshot = () => false;
const getClientSnapshot = () => true;

function useIsMounted(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}

type Variant = "icon" | "segmented";

type ThemeToggleProps = {
  className?: string;
  variant?: Variant;
  labels?: {
    /** Aria/title used by the icon variant; describes the *next* state. */
    cycleToLight?: string;
    cycleToDark?: string;
    cycleToSystem?: string;
    /** Generic fallback before mount. */
    generic?: string;
    /** Segmented option labels. */
    auto?: string;
    dark?: string;
    light?: string;
  };
};

const DEFAULT_LABELS = {
  cycleToLight: "Switch to light theme",
  cycleToDark: "Switch to dark theme",
  cycleToSystem: "Follow system theme",
  generic: "Toggle theme",
  auto: "Auto",
  dark: "Dark",
  light: "Light",
};

export function ThemeToggle({
  className = "",
  variant = "icon",
  labels: labelsProp,
}: ThemeToggleProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const { choice, resolved, setChoice, cycleChoice } = useTheme();
  const mounted = useIsMounted();

  const handleSetChoice = (next: ThemeChoice) => {
    if (next !== choice) {
      track("theme_change", { from: choice, to: next });
    }
    setChoice(next);
  };

  const handleCycleChoice = () => {
    const next: ThemeChoice = resolved === "dark" ? "light" : "dark";
    track("theme_change", { from: choice, to: next });
    cycleChoice();
  };

  if (variant === "segmented") {
    const options: { value: ThemeChoice; label: string }[] = [
      { value: "system", label: labels.auto },
      { value: "light", label: labels.light },
      { value: "dark", label: labels.dark },
    ];
    return (
      <div
        className={`inline-flex items-stretch border border-[var(--color-border-strong)] ${className}`}
        role="group"
        aria-label={labels.generic}
      >
        {options.map((opt, i) => {
          const active = mounted && choice === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSetChoice(opt.value)}
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

  // Icon variant — single tap flips between light and dark based on what's
  // actually rendered. Aria-label describes the NEXT state. Re-enabling
  // "Auto" / system mode is done via the segmented variant in the mobile menu.
  const nextLabel = mounted
    ? resolved === "dark"
      ? labels.cycleToLight
      : labels.cycleToDark
    : labels.generic;

  return (
    <button
      type="button"
      onClick={handleCycleChoice}
      aria-label={nextLabel}
      title={nextLabel}
      className={`inline-flex items-center justify-center w-6 h-6 text-[var(--color-text-faint)] hover:text-[var(--color-text)] transition-colors ${className}`}
      suppressHydrationWarning
    >
      <span suppressHydrationWarning>
        {!mounted ? <SunIcon /> : resolved === "dark" ? <MoonIcon /> : <SunIcon />}
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

