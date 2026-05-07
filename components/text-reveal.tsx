"use client";
import { motion, useReducedMotion } from "motion/react";
import type { ElementType } from "react";

type TextRevealProps = {
  text: string;
  as?: ElementType;
  className?: string;
  step?: number;
  delay?: number;
  trigger?: "scroll" | "mount";
};

export function TextReveal({
  text,
  as: Tag = "span",
  className,
  step = 30,
  delay = 0,
  trigger = "scroll",
}: TextRevealProps) {
  const reduce = useReducedMotion();
  if (reduce) return <Tag className={className}>{text}</Tag>;

  const words = text.split(/\s+/);
  const isMount = trigger === "mount";

  return (
    <Tag className={className} aria-label={text}>
      {words.map((word, i) => (
        <motion.span
          key={`${i}-${word}`}
          aria-hidden
          className="inline-block whitespace-pre"
          initial={{ opacity: 0, y: "0.6em" }}
          {...(isMount
            ? { animate: { opacity: 1, y: 0 } }
            : {
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true, margin: "-10% 0px" },
              })}
          transition={{
            duration: 0.45,
            ease: [0.16, 1, 0.3, 1],
            delay: (delay + i * step) / 1000,
          }}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </Tag>
  );
}
