"use client";

import { BlockTitle } from "@/components/ai/review-blocks";
import { NutritionTrendSvg } from "@/components/day/nutrition-trend-svg";
import { formatG } from "@/lib/ai/format";
import type { ReviewDayRow } from "@/lib/ai/types";
import { chartLayout, chartSeries, chartY } from "@/lib/chart-shape";
import { chartInsight, chartMean } from "@/lib/chart-stats";
import { formatKcal } from "@/lib/nutrition/macros";

export const MACRO_CHART = {
  kcal: {
    label: "Ккал",
    color: "var(--primary)",
    target: "kcal_target",
    format: (value: number) => `${formatKcal(value)} ккал`,
  },
  protein: {
    label: "Белок",
    color: "var(--macro-protein)",
    target: "protein_target",
    format: (value: number) => `${formatG(value)} г`,
  },
  fat: {
    label: "Жир",
    color: "var(--macro-fat)",
    target: "fat_target",
    format: (value: number) => `${formatG(value)} г`,
  },
  carbs: {
    label: "Углеводы",
    color: "var(--macro-carbs)",
    target: "carbs_target",
    format: (value: number) => `${formatG(value)} г`,
  },
} as const;

export function MacroChart({
  days,
  metric,
}: {
  days: ReviewDayRow[];
  metric: keyof typeof MACRO_CHART;
}) {
  if (days.length < 2) {
    return null;
  }

  const spec = MACRO_CHART[metric];
  const facts = days.map((day) => day[metric]);
  const targets = days.map((day) => day[spec.target]);
  const hasTarget = targets.some((value) => value > 0);
  const layout = chartLayout(
    hasTarget ? [...facts, ...targets] : facts,
    days.length,
    320,
    176,
    16,
  );
  const factSeries = layout ? chartSeries(facts, layout) : null;
  const targetSeries =
    layout && hasTarget ? chartSeries(targets, layout) : null;
  const last = days[days.length - 1];
  if (!layout || !factSeries || !last) {
    return null;
  }

  const mean = chartMean(facts);
  const targetMean = hasTarget ? chartMean(targets) : null;
  const format = spec.format;
  const label = spec.label;
  const color = spec.color;

  return (
    <div className="flex flex-col gap-2">
      <BlockTitle color={color}>{label} по дням</BlockTitle>
      <NutritionTrendSvg
        layout={layout}
        factSeries={factSeries}
        targetSeries={targetSeries ?? undefined}
        color={color}
        label={label}
        fillId={`review-${metric}`}
        maxLabel={format(Math.max(...facts))}
        minLabel={format(Math.min(...facts))}
        lastDate={last.date}
        guideY={
          mean != null && layout.dataMax !== layout.dataMin
            ? chartY(mean, layout)
            : undefined
        }
        endValue={format(facts[facts.length - 1] ?? 0)}
        insight={chartInsight([
          mean != null ? `среднее ${format(mean)}` : null,
          targetMean != null ? `цель ${format(targetMean)}` : null,
        ])}
        plotClassName="h-36"
      />
    </div>
  );
}
