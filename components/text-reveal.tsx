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

  // `mount` reveals run on CSS, not motion, and animate transform only. Motion
  // serializes its `initial` state into the SSR payload, so an opacity-0 start
  // would ship the text invisible and stall LCP until hydration — these are
  // above-the-fold headings, including the homepage h1 (the LCP element).
  // A transform-only animation paints at full opacity in the first frame.
  if (trigger === "mount") {
    return (
      <Tag className={className}>
        {words.map((word, i) => (
          <span
            key={`${i}-${word}`}
            className="text-reveal-word"
            style={{ animationDelay: `${delay + i * step}ms` }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <Tag className={className} aria-label={text}>
      {words.map((word, i) => (
        <motion.span
          key={`${i}-${word}`}
          aria-hidden
          className="inline-block whitespace-pre"
          initial={{ opacity: 0, y: "0.6em" }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
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
