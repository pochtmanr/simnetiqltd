"use client";

import type { ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { compactMoney, groupDigits } from "@/lib/business-os/workspace/format";

export type ChartRow = { label: string } & Record<string, number | string | null>;
export type ChartSeries = { key: string; label: string; color?: number };

const color = (index: number) => `var(--bos-series-${(index % 6) + 1})`;

function valueText(value: number, unit: "money" | "count", currency: string | null, compact: boolean): string {
  if (unit === "money") {
    if (compact) return compactMoney(value, currency);
    return `${groupDigits(value.toFixed(2))}${currency ? ` ${currency}` : ""}`;
  }
  return compact && Math.abs(value) >= 10_000 ? `${(value / 1000).toFixed(0)}k` : groupDigits(String(Math.round(value)));
}

/**
 * Line, area, or bar chart over labelled rows. Missing values stay gaps — a null
 * is never drawn as zero. A visually hidden table carries the same figures.
 */
export function SeriesChart({
  data,
  series,
  kind = "area",
  unit = "money",
  currency = null,
  height = 240,
  empty = "No data for this period",
  stacked = false,
}: {
  data: ChartRow[];
  series: ChartSeries[];
  kind?: "area" | "line" | "bar";
  unit?: "money" | "count";
  currency?: string | null;
  height?: number;
  empty?: ReactNode;
  stacked?: boolean;
}) {
  const hasValue = data.some((row) => series.some((item) => typeof row[item.key] === "number"));
  if (!hasValue) {
    return (
      <div className="bos-chart" style={{ height }}>
        <div className="bos-chart__empty">{empty}</div>
      </div>
    );
  }
  const common = {
    data,
    responsive: true,
    style: { width: "100%", height },
    margin: { top: 8, right: 8, bottom: 0, left: 0 },
    accessibilityLayer: false,
  } as const;
  const axes = (
    <>
      <CartesianGrid vertical={false} strokeDasharray="0" />
      <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={16} tickMargin={8} />
      <YAxis
        width={56}
        tickLine={false}
        axisLine={false}
        tickCount={5}
        tickFormatter={(value: number) => valueText(value, unit, currency, true)}
      />
      <Tooltip
        cursor={kind === "bar" ? { fill: "var(--bos-hover)" } : undefined}
        content={({ active, payload, label }) =>
          active && payload?.length ? (
            <div className="bos-tooltip">
              <p className="bos-caption mb-1">{label}</p>
              {payload.map((entry) => (
                <p key={String(entry.dataKey)} className="bos-tooltip__row">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="bos-swatch" style={{ background: entry.color }} />
                    {entry.name}
                  </span>
                  <span className="bos-num font-medium">
                    {typeof entry.value === "number" ? valueText(entry.value, unit, currency, false) : "Unavailable"}
                  </span>
                </p>
              ))}
            </div>
          ) : null
        }
      />
    </>
  );

  let chart: ReactNode;
  if (kind === "bar") {
    chart = (
      <BarChart {...common} barCategoryGap="24%">
        {axes}
        {series.map((item, index) => (
          <Bar key={item.key} dataKey={item.key} name={item.label} fill={color(item.color ?? index)} radius={stacked ? 0 : [4, 4, 0, 0]} stackId={stacked ? "a" : undefined} maxBarSize={36} isAnimationActive={false} />
        ))}
      </BarChart>
    );
  } else if (kind === "line") {
    chart = (
      <LineChart {...common}>
        {axes}
        {series.map((item, index) => (
          <Line key={item.key} dataKey={item.key} name={item.label} stroke={color(item.color ?? index)} strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls={false} isAnimationActive={false} type="monotone" />
        ))}
      </LineChart>
    );
  } else {
    chart = (
      <AreaChart {...common}>
        <defs>
          {series.map((item, index) => (
            <linearGradient key={item.key} id={`bos-fill-${item.key}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color(item.color ?? index)} stopOpacity={0.24} />
              <stop offset="100%" stopColor={color(item.color ?? index)} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        {axes}
        {series.map((item, index) => (
          <Area key={item.key} dataKey={item.key} name={item.label} stroke={color(item.color ?? index)} strokeWidth={2} fill={`url(#bos-fill-${item.key})`} connectNulls={false} isAnimationActive={false} type="monotone" />
        ))}
      </AreaChart>
    );
  }

  return (
    <div className="bos-chart">
      {series.length > 1 ? (
        <div className="bos-legend mb-2">
          {series.map((item, index) => (
            <span key={item.key}>
              <span className="bos-swatch" style={{ background: color(item.color ?? index) }} />
              {item.label}
            </span>
          ))}
        </div>
      ) : null}
      <div aria-hidden>{chart}</div>
      <div className="sr-only">
        <table>
          <thead>
            <tr>
              <th>Period</th>
              {series.map((item) => (
                <th key={item.key}>{item.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                {series.map((item) => (
                  <td key={item.key}>{typeof row[item.key] === "number" ? valueText(row[item.key] as number, unit, currency, false) : "Unavailable"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Hand-drawn sparkline: no axes, gaps for missing points, last point marked. */
export function Sparkline({ values, className }: { values: (number | null)[]; className?: string }) {
  const points = values.map((value, index) => ({ value, index }));
  const known = points.filter((point): point is { value: number; index: number } => point.value !== null);
  if (known.length < 2) return null;
  const min = Math.min(...known.map((point) => point.value));
  const max = Math.max(...known.map((point) => point.value));
  const span = max - min || 1;
  const width = 96;
  const height = 32;
  const x = (index: number) => (values.length === 1 ? width : (index / (values.length - 1)) * (width - 4) + 2);
  const y = (value: number) => height - 3 - ((value - min) / span) * (height - 6);
  let path = "";
  let pen = false;
  for (const point of points) {
    if (point.value === null) {
      pen = false;
      continue;
    }
    path += `${pen ? "L" : "M"}${x(point.index).toFixed(1)},${y(point.value).toFixed(1)}`;
    pen = true;
  }
  const last = known[known.length - 1];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className ?? "bos-kpi__spark"} aria-hidden>
      <path d={path} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      {last ? <circle cx={x(last.index)} cy={y(last.value)} r={2.5} fill="currentColor" /> : null}
    </svg>
  );
}
