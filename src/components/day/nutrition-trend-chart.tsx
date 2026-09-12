import { NutritionTrendSvg } from "@/components/day/nutrition-trend-svg";
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
    <NutritionTrendSvg
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
    <NutritionTrendSvg
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

function formatMetricValue(metric: NutritionMetric, value: number): string {
  return metric === "kcal" ? formatKcal(value) : formatMacro(value);
}
