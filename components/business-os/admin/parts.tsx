import type { ReactNode } from "react";
import { Sparkline } from "@/components/business-os/ui/charts";
import { StatusPill } from "@/components/business-os/ui/primitives";
import { chartNumber, formatMonth, formatMoney, humanize, isNegative } from "@/lib/business-os/workspace/format";
import type { WorkspaceData } from "@/lib/business-os/workspace/load";
import type { MoneyMetric, ReportBucket } from "@/lib/business-os/workspace/present";

/** A money figure: grouped digits, currency symbol, red minus. Null reads "Unavailable". */
export function Amount({ amount, currency, className }: { amount: string | null; currency: string | null; className?: string }) {
  const text = formatMoney(amount, currency);
  if (amount === null) return <span className={["text-[var(--color-text-dim)]", className].filter(Boolean).join(" ")}>{text}</span>;
  return <span className={["bos-num", isNegative(amount) ? "bos-neg" : "", className].filter(Boolean).join(" ")}>{text}</span>;
}

/** Quality pill for any figure that is not a plain actual. The reason sits in the tooltip. */
export function QualityPill({ metric, compact }: { metric: MoneyMetric | null; compact?: boolean }) {
  if (!metric) return <StatusPill status="unavailable" compact={compact} />;
  if (metric.amount !== null && metric.quality === "actual" && (!metric.coverage || metric.coverage === "complete")) return null;
  const status = metric.amount === null ? "unavailable" : metric.quality === "actual" ? (metric.coverage ?? "partial") : metric.quality;
  const known = status === "unavailable" ? "Unavailable" : humanize(status);
  return <StatusPill status={status} compact={compact} title={metric.reason ? `${known} · ${humanize(metric.reason)}` : undefined} />;
}

export function metricReason(metric: MoneyMetric | null, fallback?: string | null): string | null {
  if (metric?.amount === null || !metric) return humanize(metric?.reason ?? fallback ?? null) || null;
  return metric.reason ? humanize(metric.reason) : null;
}

export function KpiCard({
  label,
  icon,
  metric,
  href,
  spark,
  delta,
  caption,
  value,
}: {
  label: string;
  icon?: ReactNode;
  metric?: MoneyMetric | null;
  href?: string;
  spark?: (number | null)[];
  delta?: { text: string; tone: "ok" | "bad" | "muted" } | null;
  caption?: ReactNode;
  /** Overrides the metric for non-money figures. */
  value?: string | null;
}) {
  const shown = value !== undefined ? value : (metric?.amount ?? null);
  const text = value !== undefined ? (value ?? "Unavailable") : formatMoney(metric?.amount ?? null, metric?.currency ?? null);
  const body = (
    <>
      <div className="bos-kpi__top">
        {icon ? <span className="text-[var(--bos-link)]">{icon}</span> : null}
        <span className="bos-label">{label}</span>
        {metric !== undefined ? <QualityPill metric={metric ?? null} /> : null}
      </div>
      <p className={`bos-kpi__value bos-num ${shown !== null && isNegative(shown) ? "bos-neg" : ""}`} data-unavailable={shown === null ? "" : undefined}>
        {text}
      </p>
      <div className="bos-kpi__foot">
        <div className="min-w-0">
          {delta ? (
            <p className="bos-delta" data-tone={delta.tone}>
              {delta.text}
            </p>
          ) : null}
          {caption ? <p className="bos-caption">{caption}</p> : null}
        </div>
        {spark ? <Sparkline values={spark} /> : null}
      </div>
    </>
  );
  return href ? (
    <a href={href} className="bos-card bos-kpi">
      {body}
    </a>
  ) : (
    <div className="bos-card bos-kpi">{body}</div>
  );
}

/* ---------- Trend ---------- */

export type TrendPoint = { label: string; from: string | null; partial: boolean; metrics: Record<string, MoneyMetric | null> | null };

/**
 * Monthly points in one currency: GBP when every bucket was converted, else the
 * requested or only native currency. Mixed currencies return no currency and
 * the chart explains why instead of adding them up.
 */
export function trendPoints(data: WorkspaceData, preferred: string | null): { currency: string | null; points: TrendPoint[]; reason: string | null } {
  const buckets: ReportBucket[] = data.trend?.report?.buckets ?? [];
  if (buckets.length === 0) return { currency: null, points: [], reason: data.trend?.error ? humanize(data.trend.error) : null };
  const natives = new Set(buckets.flatMap((bucket) => bucket.native.map((block) => block.currency)));
  const allGbp = buckets.every((bucket) => bucket.gbp.metrics);
  const currency = preferred && natives.has(preferred) ? preferred : allGbp ? "GBP" : natives.size === 1 ? [...natives][0] : null;
  if (!currency) return { currency: null, points: [], reason: "Several currencies without a GBP conversion. Pick a currency in Filters." };
  const points = buckets.map((bucket) => {
    const native = bucket.native.find((block) => block.currency === currency);
    const metrics = preferred === currency && native ? native.metrics : allGbp ? bucket.gbp.metrics : (native?.metrics ?? null);
    return { label: formatMonth(bucket.from), from: bucket.from, partial: bucket.partial, metrics };
  });
  return { currency, points, reason: null };
}

export function series(points: TrendPoint[], metric: string): (number | null)[] {
  return points.map((point) => chartNumber(point.metrics?.[metric]?.amount));
}

/**
 * Change against the previous month. Hidden when the latest month is still in
 * progress, so a part-month is never compared with a whole one. Costs going up read as bad.
 */
export function deltaOf(points: TrendPoint[], metric: string, costLike = false): { text: string; tone: "ok" | "bad" | "muted" } | null {
  if (points.length < 2 || points[points.length - 1]?.partial) return null;
  const values = series(points, metric);
  const current = values[values.length - 1];
  const previous = values[values.length - 2];
  if (current === null || current === undefined || previous === null || previous === undefined || previous === 0) return null;
  const change = (current - previous) / Math.abs(previous);
  if (!Number.isFinite(change)) return null;
  const up = change >= 0;
  const good = costLike ? !up : up;
  const previousLabel = points[points.length - 2]?.label ?? "previous";
  return {
    text: `${up ? "↑" : "↓"} ${Math.abs(change * 100).toFixed(1)}% vs ${previousLabel}`,
    tone: Math.abs(change) < 0.0005 ? "muted" : good ? "ok" : "bad",
  };
}
