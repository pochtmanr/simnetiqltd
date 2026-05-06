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
          <rect x="200" y="86" width="88" height="148" />
        </clipPath>
      </defs>

      {/* ============================================================ */}
      {/* MESSAGES popped from phone (left)                             */}
      {/* ============================================================ */}

      {/* Message 1 — top */}
      <g className={`${styles.message} ${styles.m1}`}>
        <rect x="22" y="74" width="128" height="46" fill="var(--color-surface)" stroke="var(--color-primary-glow)" strokeWidth="1.4" />
        {/* avatar dot */}
        <circle cx="34" cy="88" r="3" fill="var(--color-secondary)" stroke="none" />
        {/* sender label */}
        <line x1="42" y1="88" x2="80" y2="88" stroke="var(--color-secondary)" strokeWidth="1.2" />
        {/* timestamp */}
        <line x1="126" y1="88" x2="142" y2="88" stroke="var(--color-primary-dim)" strokeWidth="1" />
        {/* message lines */}
        <line x1="42" y1="102" x2="138" y2="102" stroke="var(--color-primary-dim)" strokeWidth="1" />
        <line x1="42" y1="112" x2="118" y2="112" stroke="var(--color-primary-dim)" strokeWidth="1" />
        {/* tail pointing toward phone */}
        <path d="M 150 92 L 158 97 L 150 102" fill="var(--color-surface)" stroke="var(--color-primary-glow)" strokeWidth="1.4" />
      </g>

      {/* Message 2 — middle, largest */}
      <g className={`${styles.message} ${styles.m2}`}>
        <rect x="14" y="132" width="144" height="54" fill="var(--color-surface)" stroke="var(--color-primary-glow)" strokeWidth="1.4" />
        <circle cx="26" cy="148" r="3" fill="var(--color-secondary)" stroke="none" />
        <line x1="34" y1="148" x2="78" y2="148" stroke="var(--color-secondary)" strokeWidth="1.2" />
        <line x1="130" y1="148" x2="150" y2="148" stroke="var(--color-primary-dim)" strokeWidth="1" />
        <line x1="34" y1="162" x2="148" y2="162" stroke="var(--color-primary-dim)" strokeWidth="1" />
        <line x1="34" y1="172" x2="138" y2="172" stroke="var(--color-primary-dim)" strokeWidth="1" />
        <line x1="34" y1="182" x2="100" y2="182" stroke="var(--color-primary-dim)" strokeWidth="1" />
        <path d="M 158 154 L 166 159 L 158 164" fill="var(--color-surface)" stroke="var(--color-primary-glow)" strokeWidth="1.4" />
      </g>

      {/* Message 3 — bottom */}
      <g className={`${styles.message} ${styles.m3}`}>
        <rect x="30" y="200" width="118" height="44" fill="var(--color-surface)" stroke="var(--color-primary-glow)" strokeWidth="1.4" />
        <circle cx="42" cy="214" r="3" fill="var(--color-secondary)" stroke="none" />
        <line x1="50" y1="214" x2="84" y2="214" stroke="var(--color-secondary)" strokeWidth="1.2" />
        <line x1="50" y1="226" x2="138" y2="226" stroke="var(--color-primary-dim)" strokeWidth="1" />
        <line x1="50" y1="236" x2="110" y2="236" stroke="var(--color-primary-dim)" strokeWidth="1" />
        <path d="M 148 218 L 156 222 L 148 226" fill="var(--color-surface)" stroke="var(--color-primary-glow)" strokeWidth="1.4" />
      </g>

      {/* ============================================================ */}
      {/* PHONE (right) — proportional ~iPhone ratio (88 × 188)         */}
      {/* ============================================================ */}
      <g transform="translate(244 160) scale(0.94 1) skewY(5) translate(-244 -160)">
        {/* receded back chassis */}
        <g stroke="var(--color-primary-dim)" strokeWidth="1">
          <rect x="208" y="70" width="88" height="188" />
          <line x1="208" y1="92" x2="296" y2="92" />
          <line x1="208" y1="240" x2="296" y2="240" />
        </g>

        {/* depth strut lines */}
        <g stroke="var(--color-primary-dim)" strokeWidth="1">
          <line x1="200" y1="66" x2="208" y2="70" />
          <line x1="288" y1="66" x2="296" y2="70" />
          <line x1="200" y1="254" x2="208" y2="258" />
          <line x1="288" y1="254" x2="296" y2="258" />
        </g>

        {/* front device chassis */}
        <g stroke="var(--color-primary-glow)" strokeWidth="1.4" fill="none">
          <rect x="200" y="66" width="88" height="188" fill="var(--color-surface)" />
          <line x1="226" y1="78" x2="246" y2="78" strokeWidth="1" />
          <circle cx="260" cy="78" r="1.5" fill="var(--color-primary-glow)" stroke="none" />
          <rect x="200" y="86" width="88" height="148" strokeWidth="1" />
          <line x1="224" y1="244" x2="264" y2="244" strokeWidth="1" />
        </g>

        <g clipPath="url(#mobile-screen-clip)">
          {/* SCREEN 1 — list */}
          <g className={`${styles.screen} ${styles.s1}`} stroke="var(--color-primary-glow)" fill="none">
            <line x1="208" y1="100" x2="234" y2="100" stroke="var(--color-secondary)" strokeWidth="1.2" />
            <line x1="208" y1="110" x2="272" y2="110" strokeWidth="1" />
            <rect className={styles.caret} x="236" y="96" width="1.4" height="8" fill="var(--color-primary-glow)" stroke="none" />
            <g strokeWidth="1">
              <rect x="208" y="120" width="72" height="18" />
              <rect x="208" y="142" width="72" height="18" />
              <rect x="208" y="164" width="72" height="18" />
              <rect x="208" y="186" width="72" height="18" />
            </g>
            <rect x="208" y="208" width="72" height="18" stroke="var(--color-secondary)" strokeWidth="1.4" />
            <line x1="226" y1="217" x2="262" y2="217" stroke="var(--color-secondary)" strokeWidth="1" />
          </g>

          {/* SCREEN 2 — chart with signal bars */}
          <g className={`${styles.screen} ${styles.s2}`} stroke="var(--color-primary-glow)" fill="none">
            <line x1="208" y1="100" x2="244" y2="100" stroke="var(--color-secondary)" strokeWidth="1.2" />
            <line x1="208" y1="110" x2="272" y2="110" strokeWidth="1" />
            <line x1="208" y1="200" x2="280" y2="200" strokeWidth="1" />
            <g fill="var(--color-primary)" stroke="none">
              <rect className={`${styles.signalBar} ${styles.b1}`} x="216" y="148" width="12" height="52" />
              <rect className={`${styles.signalBar} ${styles.b2}`} x="232" y="148" width="12" height="52" />
              <rect className={`${styles.signalBar} ${styles.b3}`} x="248" y="148" width="12" height="52" />
              <rect className={`${styles.signalBar} ${styles.b4}`} x="264" y="148" width="12" height="52" />
            </g>
            <line x1="208" y1="214" x2="280" y2="214" strokeWidth="1" stroke="var(--color-primary-dim)" />
            <line x1="208" y1="224" x2="260" y2="224" strokeWidth="1" stroke="var(--color-primary-dim)" />
          </g>

          {/* SCREEN 3 — radar / map */}
          <g className={`${styles.screen} ${styles.s3}`} stroke="var(--color-primary-glow)" fill="none">
            <line x1="208" y1="100" x2="240" y2="100" stroke="var(--color-secondary)" strokeWidth="1.2" />
            <line x1="208" y1="110" x2="272" y2="110" strokeWidth="1" />
            <circle cx="244" cy="162" r="14" stroke="var(--color-secondary)" strokeWidth="1" />
            <circle cx="244" cy="162" r="22" stroke="var(--color-primary-dim)" strokeWidth="1" />
            <circle cx="244" cy="162" r="30" stroke="var(--color-primary-dim)" strokeWidth="1" />
            <g strokeWidth="1" stroke="var(--color-primary-dim)">
              <line x1="208" y1="162" x2="280" y2="162" />
              <line x1="244" y1="124" x2="244" y2="200" />
            </g>
            <circle cx="244" cy="162" r="3" fill="var(--color-secondary)" stroke="none" />
            <line x1="208" y1="218" x2="276" y2="218" strokeWidth="1" stroke="var(--color-primary-dim)" />
            <line x1="208" y1="228" x2="252" y2="228" strokeWidth="1" stroke="var(--color-primary-dim)" />
          </g>

          {/* SCREEN 4 — code / terminal */}
          <g className={`${styles.screen} ${styles.s4}`} stroke="var(--color-primary-glow)" fill="none">
            <line x1="208" y1="100" x2="252" y2="100" stroke="var(--color-secondary)" strokeWidth="1.2" />
            <line x1="208" y1="110" x2="272" y2="110" strokeWidth="1" />
            <g strokeWidth="1">
              <line x1="208" y1="124" x2="266" y2="124" />
              <line x1="216" y1="136" x2="276" y2="136" />
              <line x1="216" y1="148" x2="256" y2="148" stroke="var(--color-secondary)" />
              <line x1="216" y1="160" x2="266" y2="160" />
              <line x1="208" y1="172" x2="246" y2="172" />
              <line x1="216" y1="184" x2="270" y2="184" />
              <line x1="216" y1="196" x2="248" y2="196" />
              <line x1="208" y1="208" x2="276" y2="208" />
            </g>
            <line x1="208" y1="222" x2="218" y2="222" strokeWidth="1" stroke="var(--color-secondary)" />
            <rect x="222" y="216" width="8" height="10" fill="var(--color-secondary)" stroke="none" />
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
