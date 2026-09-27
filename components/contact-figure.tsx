"use client";

import { memo, useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import styles from "./contact-section.module.css";

// The same dimensional dot language as the service cards, with a short entrance motion.
const dots = Array.from({ length: 720 }, (_, i) => {
  const u = Math.floor(i / 12) / 60 * Math.PI * 2;
  const v = (i % 12) / 12 * Math.PI * 2;
  const radius = 0.74 + 0.25 * Math.cos(v);
  const x = radius * Math.cos(u);
  const y = 0.25 * Math.sin(v);
  const z = radius * Math.sin(u);
  const tiltedY = y * Math.cos(0.65) - z * Math.sin(0.65);
  const depth = y * Math.sin(0.65) + z * Math.cos(0.65);
  return { x: 100 + (x * 0.94 + tiltedY * 0.34) * 85, y: 80 + (tiltedY * 0.94 - x * 0.34) * 85, depth };
}).sort((a, b) => a.depth - b.depth);

export const ContactFigure = memo(function ContactFigure() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      className={styles.figure}
      aria-hidden="true"
      initial={false}
      animate={inView && !reducedMotion ? { rotate: [0, -8, 3, 0], y: [0, -6, 0] } : { rotate: 0, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 4, ease: "easeInOut" }}
    >
      <svg viewBox="0 0 200 160" fill="currentColor">
        {dots.map((dot, i) => <circle key={i} cx={dot.x.toFixed(2)} cy={dot.y.toFixed(2)} r={(0.65 + (dot.depth + 1) * 0.16).toFixed(2)} opacity={(0.2 + (dot.depth + 1) * 0.35).toFixed(2)} />)}
      </svg>
    </motion.div>
  );
});
