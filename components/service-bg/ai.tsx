import styles from "./ai.module.css";

export function AiBg() {
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
      <g transform="translate(160 160) scale(1 0.72) rotate(-14) translate(-160 -160)">
        {/* concentric halo rings — radar-style ripple */}
        <g stroke="var(--color-primary-dim)" strokeWidth="1" fill="none">
          <circle className={`${styles.halo} ${styles.h1}`} cx="160" cy="160" r="44" />
          <circle className={`${styles.halo} ${styles.h2}`} cx="160" cy="160" r="62" />
          <circle className={`${styles.halo} ${styles.h3}`} cx="160" cy="160" r="80" />
        </g>

        {/* radial guides */}
        <g stroke="var(--color-border-faint)" strokeWidth="1">
          <line x1="58" y1="58" x2="138" y2="147" />
          <line x1="262" y1="58" x2="182" y2="147" />
          <line x1="58" y1="262" x2="138" y2="173" />
          <line x1="262" y1="262" x2="182" y2="173" />
        </g>

        {/* connection paths (background, faint) */}
        <g stroke="var(--color-primary-dim)" strokeWidth="1.2" fill="none">
          <path d="M 138 147 L 72 72" />
          <path d="M 182 147 L 248 72" />
          <path d="M 138 173 L 72 248" />
          <path d="M 182 173 L 248 248" />
        </g>

        {/* signal traces flowing outward from core */}
        <g stroke="var(--color-secondary)" strokeWidth="2" fill="none" strokeLinecap="round">
          <path
            className={`${styles.trace} ${styles.t1}`}
            d="M 138 147 L 72 72"
            strokeDasharray="20 320"
            strokeDashoffset="0"
          />
          <path
            className={`${styles.trace} ${styles.t2}`}
            d="M 182 147 L 248 72"
            strokeDasharray="20 320"
            strokeDashoffset="0"
          />
          <path
            className={`${styles.trace} ${styles.t3}`}
            d="M 138 173 L 72 248"
            strokeDasharray="20 320"
            strokeDashoffset="0"
          />
          <path
            className={`${styles.trace} ${styles.t4}`}
            d="M 182 173 L 248 248"
            strokeDasharray="20 320"
            strokeDashoffset="0"
          />
        </g>

        {/* satellite endpoints — 4 corners */}
        <g stroke="var(--color-primary-glow)" strokeWidth="1.4" fill="var(--color-surface)">
          <g className={`${styles.nodePulse} ${styles.n1}`}>
            <rect x="44" y="44" width="28" height="28" />
            <line x1="44" y1="58" x2="72" y2="58" strokeWidth="0.8" stroke="var(--color-primary-dim)" />
            <line x1="58" y1="44" x2="58" y2="72" strokeWidth="0.8" stroke="var(--color-primary-dim)" />
            <circle cx="58" cy="58" r="2" fill="var(--color-secondary)" stroke="none" />
          </g>
          <g className={`${styles.nodePulse} ${styles.n2}`}>
            <rect x="248" y="44" width="28" height="28" />
            <line x1="248" y1="58" x2="276" y2="58" strokeWidth="0.8" stroke="var(--color-primary-dim)" />
            <line x1="262" y1="44" x2="262" y2="72" strokeWidth="0.8" stroke="var(--color-primary-dim)" />
            <circle cx="262" cy="58" r="2" fill="var(--color-secondary)" stroke="none" />
          </g>
          <g className={`${styles.nodePulse} ${styles.n3}`}>
            <rect x="44" y="248" width="28" height="28" />
            <line x1="44" y1="262" x2="72" y2="262" strokeWidth="0.8" stroke="var(--color-primary-dim)" />
            <line x1="58" y1="248" x2="58" y2="276" strokeWidth="0.8" stroke="var(--color-primary-dim)" />
            <circle cx="58" cy="262" r="2" fill="var(--color-secondary)" stroke="none" />
          </g>
          <g className={`${styles.nodePulse} ${styles.n4}`}>
            <rect x="248" y="248" width="28" height="28" />
            <line x1="248" y1="262" x2="276" y2="262" strokeWidth="0.8" stroke="var(--color-primary-dim)" />
            <line x1="262" y1="248" x2="262" y2="276" strokeWidth="0.8" stroke="var(--color-primary-dim)" />
            <circle cx="262" cy="262" r="2" fill="var(--color-secondary)" stroke="none" />
          </g>
        </g>

        {/* central AI core — outer hexagon */}
        <g className={styles.core}>
          <path
            d="M 160 134 L 182 147 L 182 173 L 160 186 L 138 173 L 138 147 Z"
            stroke="var(--color-primary-glow)"
            strokeWidth="1.4"
            fill="var(--color-surface)"
          />
          <path
            d="M 160 146 L 172 153 L 172 167 L 160 174 L 148 167 L 148 153 Z"
            stroke="var(--color-primary-dim)"
            strokeWidth="0.8"
            fill="none"
          />
          {/* core crosshair */}
          <line x1="152" y1="160" x2="168" y2="160" stroke="var(--color-secondary)" strokeWidth="1" />
          <line x1="160" y1="152" x2="160" y2="168" stroke="var(--color-secondary)" strokeWidth="1" />
          <circle cx="160" cy="160" r="1.6" fill="var(--color-secondary)" stroke="none" />
        </g>

        {/* orbiting token */}
        <g className={styles.orbit}>
          <circle cx="160" cy="128" r="2.2" fill="var(--color-secondary)" stroke="none" />
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
