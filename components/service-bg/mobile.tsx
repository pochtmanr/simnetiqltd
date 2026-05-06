import styles from "./mobile.module.css";

export function MobileBg() {
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
        <clipPath id="mobile-screen-clip">
          <rect x="120" y="64" width="92" height="184" />
        </clipPath>
      </defs>

      <g transform="translate(160 160) scale(0.86 1) skewY(6) translate(-160 -160)">
        {/* receded back chassis */}
        <g stroke="var(--color-primary-dim)" strokeWidth="1">
          <rect x="128" y="44" width="92" height="232" />
          <line x1="128" y1="68" x2="220" y2="68" />
          <line x1="128" y1="252" x2="220" y2="252" />
        </g>

        {/* depth strut lines */}
        <g stroke="var(--color-primary-dim)" strokeWidth="1">
          <line x1="120" y1="40" x2="128" y2="44" />
          <line x1="212" y1="40" x2="220" y2="44" />
          <line x1="120" y1="272" x2="128" y2="276" />
          <line x1="212" y1="272" x2="220" y2="276" />
        </g>

        {/* front device chassis */}
        <g stroke="var(--color-primary-glow)" strokeWidth="1.4" fill="none">
          <rect x="120" y="40" width="92" height="232" fill="var(--color-surface)" />
          <line x1="152" y1="54" x2="172" y2="54" strokeWidth="1" />
          <circle cx="186" cy="54" r="1.5" fill="var(--color-primary-glow)" stroke="none" />
          <rect x="120" y="64" width="92" height="184" strokeWidth="1" />
          <line x1="146" y1="262" x2="186" y2="262" strokeWidth="1" />
        </g>

        <g clipPath="url(#mobile-screen-clip)">
          {/* SCREEN 1 — list */}
          <g className={`${styles.screen} ${styles.s1}`} stroke="var(--color-primary-glow)" fill="none">
            <line x1="128" y1="80" x2="156" y2="80" stroke="var(--color-secondary)" strokeWidth="1.2" />
            <line x1="128" y1="92" x2="200" y2="92" strokeWidth="1" />
            <rect className={styles.caret} x="158" y="76" width="1.4" height="8" fill="var(--color-primary-glow)" stroke="none" />
            <g strokeWidth="1">
              <rect x="128" y="106" width="76" height="22" />
              <rect x="128" y="134" width="76" height="22" />
              <rect x="128" y="162" width="76" height="22" />
              <rect x="128" y="190" width="76" height="22" />
            </g>
            <rect x="128" y="220" width="76" height="22" stroke="var(--color-secondary)" strokeWidth="1.4" />
            <line x1="148" y1="231" x2="184" y2="231" stroke="var(--color-secondary)" strokeWidth="1" />
          </g>

          {/* SCREEN 2 — chart with signal bars */}
          <g className={`${styles.screen} ${styles.s2}`} stroke="var(--color-primary-glow)" fill="none">
            <line x1="128" y1="80" x2="170" y2="80" stroke="var(--color-secondary)" strokeWidth="1.2" />
            <line x1="128" y1="92" x2="200" y2="92" strokeWidth="1" />
            <line x1="128" y1="200" x2="204" y2="200" strokeWidth="1" />
            <g fill="var(--color-primary)" stroke="none">
              <rect className={`${styles.signalBar} ${styles.b1}`} x="134" y="146" width="10" height="54" />
              <rect className={`${styles.signalBar} ${styles.b2}`} x="150" y="146" width="10" height="54" />
              <rect className={`${styles.signalBar} ${styles.b3}`} x="166" y="146" width="10" height="54" />
              <rect className={`${styles.signalBar} ${styles.b4}`} x="182" y="146" width="10" height="54" />
            </g>
            <line x1="128" y1="216" x2="204" y2="216" strokeWidth="1" stroke="var(--color-primary-dim)" />
            <line x1="128" y1="230" x2="184" y2="230" strokeWidth="1" stroke="var(--color-primary-dim)" />
          </g>

          {/* SCREEN 3 — radar / map */}
          <g className={`${styles.screen} ${styles.s3}`} stroke="var(--color-primary-glow)" fill="none">
            <line x1="128" y1="80" x2="160" y2="80" stroke="var(--color-secondary)" strokeWidth="1.2" />
            <line x1="128" y1="92" x2="200" y2="92" strokeWidth="1" />
            <circle cx="166" cy="158" r="14" stroke="var(--color-secondary)" strokeWidth="1" />
            <circle cx="166" cy="158" r="22" stroke="var(--color-primary-dim)" strokeWidth="1" />
            <circle cx="166" cy="158" r="30" stroke="var(--color-primary-dim)" strokeWidth="1" />
            <g strokeWidth="1" stroke="var(--color-primary-dim)">
              <line x1="128" y1="158" x2="204" y2="158" />
              <line x1="166" y1="118" x2="166" y2="200" />
            </g>
            <circle cx="166" cy="158" r="3" fill="var(--color-secondary)" stroke="none" />
            <line x1="128" y1="222" x2="200" y2="222" strokeWidth="1" stroke="var(--color-primary-dim)" />
            <line x1="128" y1="232" x2="172" y2="232" strokeWidth="1" stroke="var(--color-primary-dim)" />
          </g>

          {/* SCREEN 4 — code / terminal */}
          <g className={`${styles.screen} ${styles.s4}`} stroke="var(--color-primary-glow)" fill="none">
            <line x1="128" y1="80" x2="180" y2="80" stroke="var(--color-secondary)" strokeWidth="1.2" />
            <line x1="128" y1="92" x2="200" y2="92" strokeWidth="1" />
            <g strokeWidth="1">
              <line x1="128" y1="112" x2="190" y2="112" />
              <line x1="138" y1="126" x2="200" y2="126" />
              <line x1="138" y1="140" x2="180" y2="140" stroke="var(--color-secondary)" />
              <line x1="138" y1="154" x2="190" y2="154" />
              <line x1="128" y1="168" x2="170" y2="168" />
              <line x1="138" y1="182" x2="194" y2="182" />
              <line x1="138" y1="196" x2="172" y2="196" />
              <line x1="128" y1="210" x2="200" y2="210" />
            </g>
            <line x1="128" y1="226" x2="138" y2="226" strokeWidth="1" stroke="var(--color-secondary)" />
            <rect x="142" y="220" width="8" height="10" fill="var(--color-secondary)" stroke="none" />
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
