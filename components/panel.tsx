import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  corners?: boolean;
  hover?: boolean;
  as?: "div" | "section" | "article";
};

export function Panel({
  children,
  className = "",
  innerClassName = "",
  // Accepted and ignored: the corner L-marks were decoration, but the prop is
  // passed at ~60 call sites.
  hover = false,
  as: Tag = "div",
}: PanelProps) {
  return (
    <Tag className={`gradient-shell ${hover ? "is-hover" : ""} ${className}`}>
      <div className={`shell-inner relative ${innerClassName}`}>{children}</div>
    </Tag>
  );
}

type RailProps = {
  items: string[];
  className?: string;
};

export function Rail({ items, className = "" }: RailProps) {
  return (
    <div className={`rail ${className}`}>
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className="whitespace-nowrap">
          {item}
        </span>
      ))}
    </div>
  );
}

type SpecRowProps = {
  label: string;
  value: ReactNode;
};

export function SpecRow({ label, value }: SpecRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-3 border-b border-[var(--color-border)] last:border-b-0">
      <span className="text-label-sm text-[var(--color-text-dim)]">{label}</span>
      <span className="text-body-strong text-right">{value}</span>
    </div>
  );
}
