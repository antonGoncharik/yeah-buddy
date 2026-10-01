"use client";

import { ChevronDown } from "lucide-react";
import { Children, isValidElement, type ReactNode, useState } from "react";

import { ChartInsight, TrendPlot } from "@/components/chart/trend-plot";
import { MeterBar } from "@/components/ui/meter-bar";
import { StatGrid } from "@/components/ui/stat-grid";
import { formatG } from "@/lib/ai/format";
import { chartShape, chartY } from "@/lib/chart-shape";
import { chartInsight, chartMean, chartSpan } from "@/lib/chart-stats";
import { formatIsoDate } from "@/lib/day/format";
import type { FoodShare } from "@/lib/days";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";

export function ReviewSection({
  title,
  hint,
  summary,
  value,
  children,
}: {
  title: string;
  hint?: string;
  summary?: string | null;
  value?: string | null;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="card-surface animate-rise px-5 py-4">
      <button
        type="button"
        className="flex w-full items-start gap-3 text-left"
        aria-expanded={open}
        onClick={() => {
          haptic("tick");
          setOpen((current) => !current);
        }}
      >
        <span className="min-w-0 flex-1 pt-1">
          <span className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            {value ? (
              <span className="shrink-0 text-base font-semibold tracking-tight tabular-nums">
                {value}
              </span>
            ) : null}
          </span>
          {hint ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>
          ) : null}
          {!open && summary ? (
            <p className="mt-1 text-sm leading-snug text-muted-foreground">
              {summary}
            </p>
          ) : null}
        </span>
        <FoldChevron open={open} />
      </button>
      {open ? <Stack>{children}</Stack> : null}
    </section>
  );
}

export function FoldChevron({ open }: { open: boolean }) {
  return (
    <span className="flex size-8 items-center justify-center rounded-full bg-muted">
      <ChevronDown
        aria-hidden
        className={cn(
          "size-4 text-muted-foreground transition-transform duration-200",
          open && "rotate-180",
        )}
      />
    </span>
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
    <div className="mt-5 flex flex-col gap-6">
      {items.map((child, index) => (
        <div key={stackKey(child, index)}>{child}</div>
      ))}
    </div>
  );
}

export { StatGrid };

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

export function BlockTitle({
  children,
  color,
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      {color ? (
        <span
          aria-hidden
          className="size-2 shrink-0 rounded-full"
          style={{ background: color }}
        />
      ) : null}
      {children}
    </h3>
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
          <div className="h-2 overflow-hidden rounded-full bg-muted">
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
      <BlockTitle color={color}>{label}</BlockTitle>
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
