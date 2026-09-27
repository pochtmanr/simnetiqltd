"use client";

import { useSyncExternalStore } from "react";
import { useTheme, type ThemeChoice } from "@/components/theme-provider";
import styles from "@/components/theme-toggle.module.css";
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
    /** Tooltip used by the icon variant; describes the next state. */
    cycleToLight?: string;
    cycleToDark?: string;
    cycleToSystem?: string;
    /** Stable accessible name for the switch and segmented group. */
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
        className={`${styles.segmented} ${className}`}
        role="group"
        aria-label={labels.generic}
      >
        {options.map((opt) => {
          const active = mounted && choice === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSetChoice(opt.value)}
              aria-pressed={active}
              data-choice={opt.value}
              className={styles.option}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  // The root theme attribute positions the thumb before hydration; React
  // supplies the accessible state once the provider has mounted.
  const nextLabel = mounted
    ? resolved === "dark"
      ? labels.cycleToLight
      : labels.cycleToDark
    : labels.generic;
  const isDark = mounted && resolved === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={handleCycleChoice}
      aria-label={labels.generic}
      title={nextLabel}
      className={`${styles.switch} ${className}`}
    >
      <span className={styles.track} aria-hidden="true">
        <span className={styles.thumb} />
        <span className={styles.sun}><SunIcon /></span>
        <span className={styles.moon}><MoonIcon /></span>
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
      strokeWidth="1.25"
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
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11.8 8.4 A 5 5 0 1 1 5.6 2.2 a 4 4 0 0 0 6.2 6.2 z" />
    </svg>
  );
}

