"use client";

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

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
  corners,
  noTop,
  className,
  children,
  ...rest
}: Props<T>) {
  const Tag = (as ?? "section") as ElementType;
  return (
    <Tag className={`section-frame ${className ?? ""}`.trim()} {...rest}>
      {!noTop && (
        <span aria-hidden="true" className="section-frame__rule section-frame__rule--top" />
      )}
      <span aria-hidden="true" className="section-frame__rule section-frame__rule--left" />
      <span aria-hidden="true" className="section-frame__rule section-frame__rule--right" />
      {children}
      {corners && (
        <span aria-hidden="true" className="corners">
          <span className="corner tl" />
          <span className="corner tr" />
          <span className="corner bl" />
          <span className="corner br" />
        </span>
      )}
    </Tag>
  );
}
