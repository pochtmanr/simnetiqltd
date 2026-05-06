"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";

type ScrollRevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: keyof typeof motion;
  onViewportEnter?: HTMLMotionProps<"div">["onViewportEnter"];
};

export function ScrollReveal({
  children,
  delay = 0,
  className,
  as = "div",
  onViewportEnter,
}: ScrollRevealProps) {
  const Tag = motion[as] as typeof motion.div;
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.4, ease: "easeOut", delay: delay / 1000 }}
      onViewportEnter={onViewportEnter}
    >
      {children}
    </Tag>
  );
}
