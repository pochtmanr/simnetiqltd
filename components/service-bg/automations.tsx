import styles from "./automations.module.css";

export function AutomationsBg() {
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
      <g transform="translate(160 160) scale(1 0.62) rotate(-22) translate(-160 -160)">
        {/* base plate */}
        <g stroke="var(--color-primary-dim)" strokeWidth="1">
          <rect x="36" y="36" width="248" height="248" />
        </g>

        {/* inner grid */}
        <g stroke="var(--color-border-faint)" strokeWidth="1">
          <line x1="36" y1="100" x2="284" y2="100" />
          <line x1="36" y1="160" x2="284" y2="160" />
          <line x1="36" y1="220" x2="284" y2="220" />
          <line x1="100" y1="36" x2="100" y2="284" />
          <line x1="160" y1="36" x2="160" y2="284" />
          <line x1="220" y1="36" x2="220" y2="284" />
        </g>

        {/* pipeline conduits */}
        <g stroke="var(--color-primary-dim)" strokeWidth="1.2" fill="none">
          <path d="M 78 88 L 130 88 L 130 152 L 144 152" />
          <path d="M 78 232 L 130 232 L 130 168 L 144 168" />
          <path d="M 176 152 L 200 152 L 200 80 L 240 80" />
          <path d="M 176 160 L 240 160" />
          <path d="M 176 168 L 200 168 L 200 240 L 240 240" />
        </g>

        {/* signals tracing the pipelines */}
        <g stroke="var(--color-secondary)" strokeWidth="2" fill="none" strokeLinecap="round">
          <path
            className={`${styles.trace} ${styles.t1}`}
            d="M 78 88 L 130 88 L 130 152 L 176 152 L 200 152 L 200 80 L 240 80"
            strokeDasharray="28 320"
            strokeDashoffset="0"
          />
          <path
            className={`${styles.trace} ${styles.t2}`}
            d="M 78 232 L 130 232 L 130 168 L 176 168 L 240 160"
            strokeDasharray="28 320"
            strokeDashoffset="0"
          />
          <path
            className={`${styles.trace} ${styles.t3}`}
            d="M 78 88 L 130 88 L 130 168 L 176 168 L 200 168 L 200 240 L 240 240"
            strokeDasharray="28 320"
            strokeDashoffset="0"
          />
        </g>

        {/* nodes */}
        <g stroke="var(--color-primary-glow)" strokeWidth="1.4" fill="var(--color-surface)">
          {/* input A */}
          <g className={`${styles.nodePulse} ${styles.n1}`}>
            <rect x="50" y="72" width="28" height="32" />
            <line x1="50" y1="86" x2="78" y2="86" strokeWidth="0.8" stroke="var(--color-primary-dim)" />
            <circle cx="64" cy="80" r="2" fill="var(--color-secondary)" stroke="none" />
          </g>

          {/* input B */}
          <g className={`${styles.nodePulse} ${styles.n2}`}>
            <rect x="50" y="216" width="28" height="32" />
            <line x1="50" y1="230" x2="78" y2="230" strokeWidth="0.8" stroke="var(--color-primary-dim)" />
            <circle cx="64" cy="224" r="2" fill="var(--color-secondary)" stroke="none" />
          </g>

          {/* central processor */}
          <g className={styles.processor}>
            <rect x="138" y="138" width="40" height="44" strokeWidth="1.4" />
            <rect
              x="146"
              y="146"
              width="24"
              height="28"
              stroke="var(--color-primary-dim)"
              strokeWidth="0.8"
              fill="none"
            />
          </g>

          {/* processor crosshair */}
          <g fill="none" stroke="var(--color-secondary)" strokeWidth="1">
            <g transform="translate(160 160)">
              <line x1="-8" y1="0" x2="8" y2="0" />
              <line x1="0" y1="-8" x2="0" y2="8" />
            </g>
          </g>
          <circle cx="160" cy="160" r="2" fill="var(--color-secondary)" stroke="none" />

          {/* output 1 */}
          <g className={`${styles.nodePulse} ${styles.n3}`}>
            <rect x="240" y="64" width="32" height="32" />
            <line x1="240" y1="80" x2="272" y2="80" strokeWidth="0.8" stroke="var(--color-primary-dim)" />
            <line x1="256" y1="64" x2="256" y2="96" strokeWidth="0.8" stroke="var(--color-primary-dim)" />
          </g>

          {/* output 2 */}
          <g className={`${styles.nodePulse} ${styles.n4}`}>
            <rect x="240" y="144" width="32" height="32" />
            <line x1="240" y1="160" x2="272" y2="160" strokeWidth="0.8" stroke="var(--color-primary-dim)" />
            <line x1="256" y1="144" x2="256" y2="176" strokeWidth="0.8" stroke="var(--color-primary-dim)" />
          </g>

          {/* output 3 */}
          <g className={`${styles.nodePulse} ${styles.n1}`}>
            <rect x="240" y="224" width="32" height="32" />
            <line x1="240" y1="240" x2="272" y2="240" strokeWidth="0.8" stroke="var(--color-primary-dim)" />
            <line x1="256" y1="224" x2="256" y2="256" strokeWidth="0.8" stroke="var(--color-primary-dim)" />
          </g>
        </g>
      </g>

      {/* corner markers */}
      <g stroke="var(--color-border-strong)" strokeWidth="1" fill="none">
        <path d="M 12 12 L 12 22 M 12 12 L 22 12" />
        <path d="M 308 12 L 308 22 M 308 12 L 298 12" />
        <path d="M 12 308 L 12 298 M 12 308 L 22 308" />
        <path d="M 308 308 L 308 298 M 308 308 L 298 308" />
      </g>
    </svg>
  );
}
