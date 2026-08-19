"use client";

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

/*
 * Was a four-sided dashed enclosure with optional corner L-marks — blueprint
 * chrome that decorated every section without encoding anything. Sections are
 * now separated by spacing and a single hairline rule.
 *
 * `corners` and `noTop` are kept as accepted-and-ignored props so the ~60
 * existing call sites don't all have to change in one pass.
 */
type SectionFrameOwnProps = {
  corners?: boolean;
  noTop?: boolean;
  className?: string;
  children: ReactNode;
};

type Props<T extends ElementType> = SectionFrameOwnProps & {
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, keyof SectionFrameOwnProps | "as">;

export function SectionFrame<T extends ElementType = "section">({
  as,
  noTop,
  className,
  children,
  ...rest
}: Props<T>) {
  const Tag = (as ?? "section") as ElementType;
  return (
    <Tag
      className={`section-frame ${
        noTop ? "" : "border-t border-[var(--color-border)]"
      } ${className ?? ""}`.trim()}
      {...rest}
    >
      {children}
    </Tag>
  );
}
