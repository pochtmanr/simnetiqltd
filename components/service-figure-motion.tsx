"use client";

import { useRef, type ReactNode } from "react";
import { useInView } from "motion/react";
import styles from "./service-figure-motion.module.css";

export function ServiceFigureMotion({ children, className, variant }: {
  children: ReactNode;
  className?: string;
  variant: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref);

  return (
    <div ref={ref} className={`${styles.figure} ${className ?? ""}`} data-visible={visible} data-variant={variant} aria-hidden="true">
      <div className={styles.motion}>{children}</div>
    </div>
  );
}
