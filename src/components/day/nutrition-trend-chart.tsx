import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

import { chartLayout, chartSeries } from "@/lib/chart-shape";
import { formatBodyWeight, historyWeightPoints } from "@/lib/day/body-weight";
import { formatKcal, formatMacro } from "@/lib/nutrition";
import {
  type HistoryMetric,
  metricFact,
  metricTarget,
  type NutritionMetric,
} from "@/lib/nutrition-stats";
import type { DayHistoryRow } from "@/lib/types";

const METRIC_COLOR: Record<HistoryMetric, string> = {
  protein: "var(--macro-protein)",
  fat: "var(--macro-fat)",
  carbs: "var(--macro-carbs)",
  kcal: "var(--primary)",
  weight: "var(--foreground)",
};

const METRIC_LABEL: Record<HistoryMetric, string> = {
  protein: "Белки",
  fat: "Жиры",
  carbs: "Углеводы",
  kcal: "Ккал",
  weight: "Вес",
};

export function NutritionTrendChart({
  days,
  metric,
}: {
  days: DayHistoryRow[];
  metric: HistoryMetric;
}) {
  if (metric === "weight") {
    return <WeightTrendChart days={days} />;
  }

  return <MacroTrendChart days={days} metric={metric} />;
}

function MacroTrendChart({
  days,
  metric,
}: {
  days: DayHistoryRow[];
  metric: NutritionMetric;
}) {
  const width = 320;
  const height = 168;
  const pad = 16;
  const facts = days.map((day) => metricFact(day, metric));
  const targets = days.map((day) => metricTarget(day, metric));
  const layout = chartLayout(
    [...facts, ...targets],
    days.length,
    width,
    height,
    pad,
  );
  const factSeries = layout ? chartSeries(facts, layout) : null;
  const targetSeries = layout ? chartSeries(targets, layout) : null;
  const last = days[days.length - 1];

  if (!layout || !factSeries || !targetSeries || !last) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Кривая появится после двух дней.
      </p>
    );
  }

  return (
    <TrendSvg
      layout={layout}
      factSeries={factSeries}
      targetSeries={targetSeries}
      color={METRIC_COLOR[metric]}
      label={METRIC_LABEL[metric]}
      fillId={metric}
      maxLabel={formatMetricValue(metric, layout.max)}
      minLabel={formatMetricValue(metric, layout.min)}
      lastDate={last.date}
      caption="Факт · цель пунктиром"
    />
  );
}

function WeightTrendChart({ days }: { days: DayHistoryRow[] }) {
  const points = historyWeightPoints(days);
  const width = 320;
  const height = 168;
  const pad = 16;
  const values = points.map((point) => point.weight);
  const layout = chartLayout(values, points.length, width, height, pad);
  const factSeries = layout ? chartSeries(values, layout) : null;
  const last = points[points.length - 1];

  if (!layout || !factSeries || !last || points.length < 2) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Кривая появится после двух взвешиваний.
      </p>
    );
  }

  return (
    <TrendSvg
      layout={layout}
      factSeries={factSeries}
      color={METRIC_COLOR.weight}
      label={METRIC_LABEL.weight}
      fillId="weight"
      maxLabel={`${formatBodyWeight(layout.max)} кг`}
      minLabel={`${formatBodyWeight(layout.min)} кг`}
      lastDate={last.date}
    />
  );
}

function TrendSvg({
  layout,
  factSeries,
  targetSeries,
  color,
  label,
  fillId,
  maxLabel,
  minLabel,
  lastDate,
  caption,
}: {
  layout: NonNullable<ReturnType<typeof chartLayout>>;
  factSeries: NonNullable<ReturnType<typeof chartSeries>>;
  targetSeries?: NonNullable<ReturnType<typeof chartSeries>>;
  color: string;
  label: string;
  fillId: string;
  maxLabel: string;
  minLabel: string;
  lastDate: string;
  caption?: string;
}) {
  const { width, height, pad } = layout;
  const lastDots =
    factSeries.dots.length <= 16 ? factSeries.dots : factSeries.dots.slice(-1);

  return (
    <div className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-44 w-full overflow-visible"
        role="img"
        aria-label={`${label} по дням`}
      >
        <defs>
          <linearGradient
            id={`nutrition-fill-${fillId}`}
            x1="0"
            x2="0"
            y1="0"
            y2="1"
          >
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {layout.gridY.map((y) => (
          <line
            key={y}
            x1={pad}
            x2={width - pad}
            y1={y}
            y2={y}
            className="stroke-border/80"
            strokeWidth="1"
          />
        ))}
        <path
          d={factSeries.area}
          fill={`url(#nutrition-fill-${fillId})`}
          className="origin-bottom motion-safe:animate-fade"
        />
        {targetSeries ? (
          <path
            d={targetSeries.line}
            fill="none"
            className="stroke-muted-foreground/70"
            strokeWidth="1.75"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray="5 5"
          />
        ) : null}
        <path
          d={factSeries.line}
          fill="none"
          className="motion-safe:animate-draw-line"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength={1}
        />
        {lastDots.map((dot, index) => (
          <circle
            key={`${dot.x}-${dot.y}`}
            cx={dot.x}
            cy={dot.y}
            r={index === lastDots.length - 1 ? 5 : 3.5}
            className="motion-safe:animate-fade"
            fill={color}
            style={{ animationDelay: `${120 + index * 40}ms` }}
          />
        ))}
        <text x={pad} y="12" className="fill-muted-foreground text-[11px]">
          {maxLabel}
        </text>
        <text
          x={pad}
          y={height - 4}
          className="fill-muted-foreground text-[11px]"
        >
          {minLabel}
        </text>
        <text
          x={width - pad}
          y={height - 4}
          textAnchor="end"
          className="fill-muted-foreground text-[11px]"
        >
          {formatChartDay(lastDate)}
        </text>
      </svg>
      {caption ? (
        <p className="text-sm text-muted-foreground">{caption}</p>
      ) : null}
    </div>
  );
}

function formatMetricValue(metric: NutritionMetric, value: number): string {
  return metric === "kcal" ? formatKcal(value) : formatMacro(value);
}

function formatChartDay(isoDate: string): string {
  try {
    return format(parseISO(isoDate), "d MMM", { locale: ru });
  } catch {
    return isoDate;
  }
}
