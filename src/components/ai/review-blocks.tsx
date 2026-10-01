"use client";

import { Children, isValidElement, type ReactNode } from "react";

import { ChartInsight, TrendPlot } from "@/components/chart/trend-plot";
import { MeterBar } from "@/components/ui/meter-bar";
import { formatG } from "@/lib/ai/format";
import { chartShape, chartY } from "@/lib/chart-shape";
import { chartInsight, chartMean, chartSpan } from "@/lib/chart-stats";
import { formatIsoDate } from "@/lib/day/format";
import type { FoodShare } from "@/lib/days";
import { cn } from "@/lib/utils";

export function ReviewSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="card-surface animate-rise px-5 py-5">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {hint ? (
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      ) : null}
      <Stack>{children}</Stack>
    </section>
  );
}

function stackKey(child: ReactNode, index: number): string {
  if (isValidElement(child) && child.key != null) {
    return String(child.key);
  }
  return `block-${index}`;
}

function Stack({ children }: { children: ReactNode }) {
  const items = Children.toArray(children).filter((child) => child != null);
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-col">
      {items.map((child, index) => (
        <div
          key={stackKey(child, index)}
          className={cn(
            index > 0 && "border-t border-border/70 pt-5",
            index < items.length - 1 && "pb-5",
          )}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

export function StatGrid({
  items,
}: {
  items: Array<{ label: string; value: string; detail?: string | null }>;
}) {
  const shown = items.filter((item) => item.value !== "");
  if (shown.length === 0) {
    return null;
  }

  return (
    <dl className="grid grid-cols-2 gap-2">
      {shown.map((item) => (
        <div key={item.label} className="rounded-2xl bg-muted/50 px-3 py-3">
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className="mt-1 text-lg font-semibold tracking-tight tabular-nums">
            {item.value}
          </dd>
          {item.detail ? (
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              {item.detail}
            </p>
          ) : null}
        </div>
      ))}
    </dl>
  );
}

export function MeterLine({
  label,
  value,
  ratio,
  barClass,
}: {
  label: string;
  value: string;
  ratio: number | null;
  barClass: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <p className="font-medium">{label}</p>
        <p className="tabular-nums text-muted-foreground">{value}</p>
      </div>
      {ratio != null ? <MeterBar ratio={ratio} barClass={barClass} /> : null}
    </div>
  );
}

export function BlockTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-sm font-medium text-muted-foreground">{children}</h3>
  );
}

export function ShareBars({ foods }: { foods: FoodShare[] }) {
  const top = foods.filter((food) => food.protein > 0).slice(0, 6);
  const peak = top.reduce((max, food) => Math.max(max, food.protein), 1);
  if (top.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-col gap-3">
      {top.map((food) => (
        <li key={food.name} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0">{food.name}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatG(food.protein)} г
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[var(--macro-protein)]"
              style={{
                width: `${Math.max(4, Math.round((food.protein / peak) * 100))}%`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ReviewSeriesChart({
  points,
  color,
  fillId,
  label,
  unit,
  formatValue,
}: {
  points: Array<{ date: string; value: number }>;
  color: string;
  fillId: string;
  label: string;
  unit: string;
  formatValue: (value: number) => string;
}) {
  if (points.length < 2) {
    return null;
  }

  const values = points.map((point) => point.value);
  const shape = chartShape(values, 320, 176, 16);
  const last = points[points.length - 1];
  if (!shape || !last) {
    return null;
  }

  const mean = chartMean(values);
  const span = chartSpan(values);
  const withUnit = (value: number) => `${formatValue(value)} ${unit}`;

  return (
    <div className="flex flex-col gap-2">
      <BlockTitle>{label}</BlockTitle>
      <ChartInsight>
        {chartInsight([
          span && span.first !== span.last
            ? `${withUnit(span.first)} → ${withUnit(span.last)}`
            : null,
          mean != null ? `среднее ${withUnit(mean)}` : null,
        ])}
      </ChartInsight>
      <TrendPlot
        layout={shape}
        series={shape}
        color={color}
        fillId={fillId}
        ariaLabel={label}
        maxLabel={withUnit(shape.dataMax)}
        minLabel={withUnit(shape.dataMin)}
        endLabel={formatIsoDate(last.date, "d MMM")}
        guideY={
          mean != null && shape.dataMax !== shape.dataMin
            ? chartY(mean, shape)
            : undefined
        }
        endValue={withUnit(last.value)}
      />
    </div>
  );
}
