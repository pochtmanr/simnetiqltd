import styles from "./growth.module.css";

const BARS: Array<{ x: number; height: number; cls: string }> = [
  { x: 56,  height: 22, cls: "b1" },
  { x: 90,  height: 38, cls: "b2" },
  { x: 124, height: 30, cls: "b3" },
  { x: 158, height: 56, cls: "b4" },
  { x: 192, height: 48, cls: "b5" },
  { x: 226, height: 72, cls: "b6" },
];

export function GrowthBg() {
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
      <g transform="translate(160 160) scale(0.7) translate(-160 -160)">
      <g transform="translate(160 160) scale(0.88 1) skewY(-8) translate(-160 -160)">
        {/* receded back face */}
        <g stroke="var(--color-primary-dim)" strokeWidth="1">
          <rect x="44" y="60" width="232" height="200" />
          <line x1="44" y1="92" x2="276" y2="92" />
          <line x1="44" y1="240" x2="276" y2="240" />
        </g>

        {/* depth strut lines */}
        <g stroke="var(--color-primary-dim)" strokeWidth="1">
          <line x1="40" y1="56" x2="44" y2="60" />
          <line x1="272" y1="56" x2="276" y2="60" />
          <line x1="40" y1="256" x2="44" y2="260" />
          <line x1="272" y1="256" x2="276" y2="260" />
        </g>

        {/* front chassis */}
        <g stroke="var(--color-primary-glow)" strokeWidth="1.4">
          <rect x="40" y="56" width="232" height="200" fill="var(--color-surface)" />

          {/* header rule */}
          <line x1="40" y1="88" x2="272" y2="88" strokeWidth="1" />

          {/* mock title bar */}
          <line x1="56" y1="74" x2="120" y2="74" stroke="var(--color-secondary)" strokeWidth="1" />
          <line x1="56" y1="80" x2="96" y2="80" stroke="var(--color-primary-dim)" strokeWidth="1" />

          {/* trend badge top-right */}
          <g className={styles.badge}>
            <rect
              x="226"
              y="66"
              width="36"
              height="16"
              stroke="var(--color-secondary)"
              strokeWidth="1"
              fill="none"
            />
            {/* up arrow */}
            <path
              d="M 234 78 L 240 70 L 244 74 L 254 68"
              stroke="var(--color-secondary)"
              strokeWidth="1.2"
              fill="none"
            />
            <path
              d="M 250 68 L 254 68 L 254 72"
              stroke="var(--color-secondary)"
              strokeWidth="1.2"
              fill="none"
            />
          </g>
        </g>

        {/* inner faint grid (chart area) */}
        <g stroke="var(--color-border-faint)" strokeWidth="1">
          <line x1="48" y1="128" x2="268" y2="128" />
          <line x1="48" y1="160" x2="268" y2="160" />
          <line x1="48" y1="192" x2="268" y2="192" />
          <line x1="48" y1="224" x2="268" y2="224" />
        </g>

        {/* baseline tick row — one per bar, matching column width */}
        <g stroke="var(--color-primary-dim)" strokeWidth="0.8">
          {BARS.map((bar) => (
            <line
              key={`tick-${bar.cls}`}
              x1={bar.x}
              y1="244"
              x2={bar.x + 22}
              y2="244"
            />
          ))}
        </g>

        {/* bar chart — bars anchored at y=240 baseline */}
        <g fill="var(--color-primary)" stroke="var(--color-primary-dim)" strokeWidth="1">
          {BARS.map((bar) => (
            <rect
              key={bar.cls}
              className={`${styles.bar} ${styles[bar.cls]}`}
              x={bar.x}
              y={240 - bar.height}
              width="22"
              height={bar.height}
            />
          ))}
        </g>

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
