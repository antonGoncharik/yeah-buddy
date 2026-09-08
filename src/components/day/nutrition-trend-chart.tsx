import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

import { chartLayout, chartSeries } from "@/lib/chart-shape";
import { formatKcal, formatMacro } from "@/lib/nutrition";
import {
  metricFact,
  metricTarget,
  type NutritionMetric,
} from "@/lib/nutrition-stats";
import type { DayHistoryRow } from "@/lib/types";

const METRIC_COLOR: Record<NutritionMetric, string> = {
  protein: "var(--macro-protein)",
  fat: "var(--macro-fat)",
  carbs: "var(--macro-carbs)",
  kcal: "var(--primary)",
};

const METRIC_LABEL: Record<NutritionMetric, string> = {
  protein: "Белки",
  fat: "Жиры",
  carbs: "Углеводы",
  kcal: "Ккал",
};

export function NutritionTrendChart({
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

  const color = METRIC_COLOR[metric];
  const formatValue = metric === "kcal" ? formatKcal : formatMacro;
  const lastDots =
    factSeries.dots.length <= 16 ? factSeries.dots : factSeries.dots.slice(-1);

  return (
    <div className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-44 w-full overflow-visible"
        role="img"
        aria-label={`${METRIC_LABEL[metric]} по дням`}
      >
        <defs>
          <linearGradient id="nutrition-fill" x1="0" x2="0" y1="0" y2="1">
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
          fill="url(#nutrition-fill)"
          className="origin-bottom motion-safe:animate-fade"
        />
        <path
          d={targetSeries.line}
          fill="none"
          className="stroke-muted-foreground/70"
          strokeWidth="1.75"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray="5 5"
        />
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
          {formatValue(layout.max)}
        </text>
        <text
          x={pad}
          y={height - 4}
          className="fill-muted-foreground text-[11px]"
        >
          {formatValue(layout.min)}
        </text>
        <text
          x={width - pad}
          y={height - 4}
          textAnchor="end"
          className="fill-muted-foreground text-[11px]"
        >
          {formatChartDay(last.date)}
        </text>
      </svg>
      <p className="text-sm text-muted-foreground">Факт · цель пунктиром</p>
    </div>
  );
}

function formatChartDay(isoDate: string): string {
  try {
    return format(parseISO(isoDate), "d MMM", { locale: ru });
  } catch {
    return isoDate;
  }
}
