import type { CSSProperties } from "react";
import styles from "./web.module.css";

type CodeLineStyle = CSSProperties & { "--len"?: string };

export function WebBg() {
  return (
    <svg
      className={styles.root}
      viewBox="0 0 320 320"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      <defs>
        <clipPath id="web-tab-clip">
          <rect x="40" y="92" width="232" height="22" />
        </clipPath>
      </defs>

      <g transform="translate(160 160) scale(0.84 1) skewY(-6) translate(-160 -160)">
        {/* receded back face */}
        <g stroke="var(--color-primary-dim)" strokeWidth="1">
          <rect x="44" y="60" width="232" height="180" />
          <line x1="44" y1="92" x2="276" y2="92" />
        </g>

        {/* depth strut lines */}
        <g stroke="var(--color-primary-dim)" strokeWidth="1">
          <line x1="40" y1="56" x2="44" y2="60" />
          <line x1="272" y1="56" x2="276" y2="60" />
          <line x1="40" y1="236" x2="44" y2="240" />
          <line x1="272" y1="236" x2="276" y2="240" />
        </g>

        {/* front browser chrome */}
        <g stroke="var(--color-primary-glow)" strokeWidth="1.4">
          <rect x="40" y="56" width="232" height="180" fill="var(--color-surface)" />
          <circle cx="54" cy="74" r="3" />
          <circle cx="66" cy="74" r="3" />
          <circle cx="78" cy="74" r="3" />
          <line x1="40" y1="88" x2="272" y2="88" />
          <rect x="98" y="68" width="160" height="14" strokeWidth="1" />
          <line x1="106" y1="75" x2="148" y2="75" stroke="var(--color-secondary)" strokeWidth="1" />
          <rect
            className={styles.caret}
            x="149"
            y="71"
            width="1.5"
            height="8"
            fill="var(--color-primary-glow)"
            stroke="none"
          />
          <line x1="40" y1="112" x2="272" y2="112" />
        </g>

        {/* tab strip — slides left in a continuous loop */}
        <g clipPath="url(#web-tab-clip)">
          <g className={styles.tabStrip}>
            <g transform="translate(-58,0)">
              <path
                d="M 44 110 L 48 96 L 96 96 L 100 110 Z"
                fill="var(--color-bg)"
                stroke="var(--color-primary-dim)"
                strokeWidth="1"
              />
              <line x1="55" y1="103" x2="89" y2="103" stroke="var(--color-primary-dim)" strokeWidth="1" />
            </g>
            <g>
              <path
                d="M 44 110 L 48 96 L 96 96 L 100 110 Z"
                fill="var(--color-surface-raised)"
                stroke="var(--color-primary-glow)"
                strokeWidth="1.2"
              />
              <line x1="55" y1="103" x2="89" y2="103" stroke="var(--color-secondary)" strokeWidth="1" />
            </g>
            <g transform="translate(58,0)">
              <path
                d="M 44 110 L 48 96 L 96 96 L 100 110 Z"
                fill="var(--color-bg)"
                stroke="var(--color-primary-dim)"
                strokeWidth="1"
              />
              <line x1="55" y1="103" x2="89" y2="103" stroke="var(--color-primary-dim)" strokeWidth="1" />
            </g>
            <g transform="translate(116,0)">
              <path
                d="M 44 110 L 48 96 L 96 96 L 100 110 Z"
                fill="var(--color-bg)"
                stroke="var(--color-primary-dim)"
                strokeWidth="1"
              />
              <line x1="55" y1="103" x2="89" y2="103" stroke="var(--color-primary-dim)" strokeWidth="1" />
            </g>
            <g transform="translate(174,0)">
              <path
                d="M 44 110 L 48 96 L 96 96 L 100 110 Z"
                fill="var(--color-bg)"
                stroke="var(--color-primary-dim)"
                strokeWidth="1"
              />
              <line x1="55" y1="103" x2="89" y2="103" stroke="var(--color-primary-dim)" strokeWidth="1" />
            </g>
            <g transform="translate(232,0)">
              <path
                d="M 44 110 L 48 96 L 96 96 L 100 110 Z"
                fill="var(--color-bg)"
                stroke="var(--color-primary-dim)"
                strokeWidth="1"
              />
              <line x1="55" y1="103" x2="89" y2="103" stroke="var(--color-primary-dim)" strokeWidth="1" />
            </g>
          </g>
        </g>

        {/* code lines — typewriter via stroke-dashoffset */}
        <g strokeWidth="1.2" strokeLinecap="square">
          <line
            className={styles.codeLine}
            style={{ "--len": "164" } as CodeLineStyle}
            x1="56"
            y1="132"
            x2="220"
            y2="132"
            stroke="var(--color-secondary)"
          />
          <line
            className={`${styles.codeLine} ${styles.l2}`}
            style={{ "--len": "132" } as CodeLineStyle}
            x1="68"
            y1="148"
            x2="200"
            y2="148"
            stroke="var(--color-primary-glow)"
          />
          <line
            className={`${styles.codeLine} ${styles.l3}`}
            style={{ "--len": "112" } as CodeLineStyle}
            x1="68"
            y1="164"
            x2="180"
            y2="164"
            stroke="var(--color-primary-glow)"
            opacity="0.9"
          />
          <line
            className={`${styles.codeLine} ${styles.l4}`}
            style={{ "--len": "88" } as CodeLineStyle}
            x1="68"
            y1="180"
            x2="156"
            y2="180"
            stroke="var(--color-primary-glow)"
          />
        </g>

        {/* placeholder blocks */}
        <g stroke="var(--color-primary-dim)" strokeWidth="1">
          <rect x="56" y="196" width="60" height="28" />
          <rect x="124" y="196" width="60" height="28" />
          <rect x="192" y="196" width="60" height="28" />
        </g>
      </g>

      {/* corner markers */}
      <g stroke="var(--color-border-strong)" strokeWidth="1">
        <path d="M 12 12 L 12 22 M 12 12 L 22 12" />
        <path d="M 308 12 L 308 22 M 308 12 L 298 12" />
        <path d="M 12 308 L 12 298 M 12 308 L 22 308" />
        <path d="M 308 308 L 308 298 M 308 308 L 298 308" />
      </g>
    </svg>
  );
}
