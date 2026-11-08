import type { AnchorHTMLAttributes, ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import {
  AlertIcon,
  CheckCircleIcon,
  CircleIcon,
  ClockIcon,
  InfoIcon,
  TriangleIcon,
  XCircleIcon,
} from "@/components/business-os/ui/icons";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/* ---------- Buttons ---------- */

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";
type ButtonLook = { variant?: Variant; size?: Size; iconOnly?: boolean; block?: boolean };

function look({ variant = "secondary", size = "md", iconOnly, block }: ButtonLook) {
  return {
    "data-variant": variant,
    "data-size": size,
    "data-icon-only": iconOnly ? "" : undefined,
    "data-block": block ? "" : undefined,
  };
}

export function Button({ variant, size, iconOnly, block, className, type = "button", ...props }: ButtonLook & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={cx("bos-btn", className)} {...look({ variant, size, iconOnly, block })} {...props} />;
}

export function ButtonLink({ variant, size, iconOnly, block, className, ...props }: ButtonLook & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={cx("bos-btn", className)} {...look({ variant, size, iconOnly, block })} {...props} />;
}

/* ---------- Fields ---------- */

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("bos-field", className)}>
      <label className="bos-field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="bos-field__error" role="alert">
          <AlertIcon size={12} />
          {error}
        </p>
      ) : hint ? (
        <p className="bos-field__hint">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, size, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & { size?: "sm" | "md" }) {
  return <input className={cx("bos-input", className)} data-size={size} {...props} />;
}

export function Select({ className, size, ...props }: Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & { size?: "sm" | "md" }) {
  return <select className={cx("bos-input", className)} data-size={size} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx("bos-input", className)} {...props} />;
}

export function Checkbox({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className="bos-check">
      <input type="checkbox" {...props} />
      {label}
    </label>
  );
}

/** Decimal amount with a currency adornment; when `currencies` is set the code is a select inside the control. */
export function MoneyInput({
  id,
  name,
  currency,
  currencyName,
  currencies,
  defaultValue,
  required,
  invalid,
  autoFocus,
}: {
  autoFocus?: boolean;
  id?: string;
  name: string;
  currency?: string;
  currencyName?: string;
  currencies?: readonly string[];
  defaultValue?: string;
  required?: boolean;
  invalid?: boolean;
}) {
  return (
    <div className="bos-affix">
      {currencies ? null : <span className="bos-affix__text">{currency ?? "—"}</span>}
      <input
        id={id}
        name={name}
        className="bos-input bos-money"
        inputMode="decimal"
        autoComplete="off"
        pattern="-?[0-9]+([.,][0-9]{1,4})?"
        placeholder="0.00"
        defaultValue={defaultValue}
        required={required}
        autoFocus={autoFocus}
        aria-invalid={invalid || undefined}
      />
      {currencies ? (
        <select name={currencyName ?? "currency"} defaultValue={currency} className="bos-input" aria-label="Currency">
          {currencies.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}

/* ---------- Status ---------- */

export type Tone = "ok" | "warn" | "bad" | "stale" | "info" | "muted";

const TONE_ICON: Record<Tone, ReactNode> = {
  ok: <CheckCircleIcon />,
  warn: <TriangleIcon />,
  bad: <XCircleIcon />,
  stale: <ClockIcon />,
  info: <InfoIcon />,
  muted: <CircleIcon />,
};

const STATUS: Record<string, { tone: Tone; label: string }> = {
  ok: { tone: "ok", label: "Healthy" },
  degraded: { tone: "warn", label: "Degraded" },
  outage: { tone: "bad", label: "Down" },
  unconfigured: { tone: "muted", label: "Not set up" },
  unavailable: { tone: "muted", label: "Unavailable" },
  verified: { tone: "ok", label: "Verified" },
  unverified: { tone: "warn", label: "Unverified" },
  current: { tone: "ok", label: "Current" },
  stale: { tone: "stale", label: "Stale" },
  retained: { tone: "muted", label: "Retained" },
  committed: { tone: "ok", label: "Committed" },
  leased: { tone: "info", label: "Running" },
  failed: { tone: "bad", label: "Failed" },
  quarantined: { tone: "warn", label: "Quarantined" },
  resync: { tone: "info", label: "Resync" },
  draft: { tone: "info", label: "Draft" },
  posted: { tone: "ok", label: "Posted" },
  reversed: { tone: "muted", label: "Reversed" },
  actual: { tone: "ok", label: "Actual" },
  estimated: { tone: "warn", label: "Estimated" },
  partial: { tone: "warn", label: "Partial" },
  complete: { tone: "ok", label: "Complete" },
  missing: { tone: "muted", label: "Missing" },
  active: { tone: "ok", label: "Active" },
};

export function statusTone(status: string | null | undefined): Tone {
  return (status && STATUS[status]?.tone) || "muted";
}

export function StatusPill({ status, label, tone, title, compact }: { status?: string | null; label?: ReactNode; tone?: Tone; title?: string; compact?: boolean }) {
  const known = status ? STATUS[status] : undefined;
  const resolvedTone = tone ?? known?.tone ?? "muted";
  const text = label ?? known?.label ?? (status ? status.replaceAll("_", " ") : "Unknown");
  return (
    <span className="bos-pill" data-tone={resolvedTone} data-compact={compact ? "" : undefined} title={title ?? (compact && typeof text === "string" ? text : undefined)}>
      {TONE_ICON[resolvedTone]}
      <span className="bos-pill__text">{text}</span>
    </span>
  );
}

/* ---------- Surfaces ---------- */

export function Card({ children, className, pad, as: Tag = "section" }: { children: ReactNode; className?: string; pad?: boolean; as?: "section" | "div" | "article" }) {
  return <Tag className={cx("bos-card", pad && "bos-card__pad", className)}>{children}</Tag>;
}

export function CardHead({ title, meta, actions }: { title: ReactNode; meta?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="bos-card__head">
      <div className="min-w-0 flex-1">
        <h3 className="bos-h3">{title}</h3>
        {meta ? <p className="bos-caption mt-0.5">{meta}</p> : null}
      </div>
      {actions}
    </header>
  );
}

export function Section({ title, description, actions, children, id }: { title?: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <section className="bos-section" id={id}>
      {title || actions ? (
        <div className="bos-section__head">
          <div className="min-w-0">
            {title ? <h2 className="bos-h2">{title}</h2> : null}
            {description ? <p className="bos-caption mt-0.5">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Notice({ tone = "info", children, action }: { tone?: "info" | "warn" | "bad" | "ok"; children: ReactNode; action?: ReactNode }) {
  const icon = tone === "bad" ? <XCircleIcon /> : tone === "warn" ? <TriangleIcon /> : tone === "ok" ? <CheckCircleIcon /> : <InfoIcon />;
  return (
    <div className="bos-notice" data-tone={tone} role={tone === "bad" ? "alert" : undefined}>
      {icon}
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="bos-empty">
      {icon ? <span className="bos-empty__icon">{icon}</span> : null}
      <strong>{title}</strong>
      {children ? <div className="bos-body max-w-md">{children}</div> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function KeyValues({ rows }: { rows: [ReactNode, ReactNode][] }) {
  return (
    <dl className="bos-dl">
      {rows.map(([label, value], index) => (
        <div key={index}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("bos-skel", className)} aria-hidden />;
}
