"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import styles from "./hero-chart-proof.module.css";

export type ChartProofCopy = {
  label: string;
  value: string;
  highlights: string[];
  next: string;
  pause: string;
  resume: string;
};

export function HeroChartProof({ copy }: { copy: ChartProofCopy }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useReducedMotion();
  const count = copy.highlights.length + 1;
  const current = index === 0 ? copy.value : copy.highlights[index - 1];

  useEffect(() => {
    if (paused || hovered || focused || reducedMotion !== false) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((previous) => (previous + 1) % count);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [paused, hovered, focused, reducedMotion, count]);

  return (
    <div
      className={`hero-field__proof ${styles.proof}`}
      role="group"
      aria-label={`${copy.label}: ${copy.value}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <button
        type="button"
        className={styles.control}
        onClick={() => {
          if (reducedMotion) setIndex((previous) => (previous + 1) % count);
          else setPaused((previous) => !previous);
        }}
        aria-label={`${current}. ${reducedMotion ? copy.next : paused ? copy.resume : copy.pause}`}
        title={reducedMotion ? copy.next : paused ? copy.resume : copy.pause}
      >
        <span className={styles.window} aria-live="off">
          <span key={index} className={styles.entry}>
            <svg className={styles.mark} viewBox="0 1 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
              <path d="M17.5 13.5c-.02-2.4 1.96-3.55 2.05-3.6-1.12-1.64-2.86-1.86-3.48-1.89-1.48-.15-2.89.87-3.64.87-.76 0-1.92-.85-3.16-.83-1.62.02-3.12.94-3.95 2.4-1.69 2.93-.43 7.27 1.21 9.65.81 1.16 1.77 2.46 3.04 2.41 1.22-.05 1.68-.79 3.16-.79 1.47 0 1.89.79 3.18.77 1.31-.02 2.14-1.18 2.94-2.34.93-1.34 1.31-2.65 1.33-2.72-.03-.01-2.55-.98-2.58-3.93zM15.05 6.45c.66-.81 1.11-1.93.99-3.05-.96.04-2.13.64-2.82 1.45-.62.71-1.16 1.86-1.02 2.95 1.07.08 2.18-.55 2.85-1.35z" />
            </svg>
            <span>{current}</span>
          </span>
        </span>
      </button>
    </div>
  );
}
