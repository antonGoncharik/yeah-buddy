import { ChartEmpty } from "@/components/chart/trend-plot";
import { NutritionTrendSvg } from "@/components/day/nutrition-trend-svg";
import { chartLayout, chartSeries, chartY } from "@/lib/chart-shape";
import {
  chartInsight,
  chartMean,
  chartSpan,
  countChartHits,
} from "@/lib/chart-stats";
import { formatBodyWeight, historyWeightPoints } from "@/lib/day/body-weight";
import { formatKcal, formatMacro } from "@/lib/nutrition";
import {
  type HistoryMetric,
  KCAL_HIT_RATIO,
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
  protein: "Белок",
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
  const height = 176;
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
  const mean = chartMean(facts);

  if (!layout || !factSeries || !targetSeries || !last) {
    return <ChartEmpty>Ещё день — и будет линия.</ChartEmpty>;
  }

  return (
    <NutritionTrendSvg
      layout={layout}
      factSeries={factSeries}
      targetSeries={targetSeries}
      color={METRIC_COLOR[metric]}
      label={METRIC_LABEL[metric]}
      fillId={metric}
      maxLabel={formatMetricValue(metric, Math.max(...facts))}
      minLabel={formatMetricValue(metric, Math.min(...facts))}
      lastDate={last.date}
      guideY={
        mean != null && layout.dataMax !== layout.dataMin
          ? chartY(mean, layout)
          : undefined
      }
      endValue={formatMetricValue(metric, metricFact(last, metric))}
      insight={macroInsight(metric, facts, targets)}
    />
  );
}

function WeightTrendChart({ days }: { days: DayHistoryRow[] }) {
  const points = historyWeightPoints(days);
  const width = 320;
  const height = 176;
  const pad = 16;
  const values = points.map((point) => point.weight);
  const layout = chartLayout(values, points.length, width, height, pad);
  const factSeries = layout ? chartSeries(values, layout) : null;
  const last = points[points.length - 1];
  const mean = chartMean(values);

  if (!layout || !factSeries || !last || points.length < 2) {
    return <ChartEmpty>Ещё одно взвешивание — и будет линия.</ChartEmpty>;
  }

  return (
    <NutritionTrendSvg
      layout={layout}
      factSeries={factSeries}
      color={METRIC_COLOR.weight}
      label={METRIC_LABEL.weight}
      fillId="weight"
      maxLabel={`${formatBodyWeight(layout.dataMax)} кг`}
      minLabel={`${formatBodyWeight(layout.dataMin)} кг`}
      lastDate={last.date}
      guideY={
        mean != null && layout.dataMax !== layout.dataMin
          ? chartY(mean, layout)
          : undefined
      }
      endValue={`${formatBodyWeight(last.weight)} кг`}
      insight={weightInsight(values)}
    />
  );
}

function macroInsight(
  metric: NutritionMetric,
  facts: number[],
  targets: number[],
): string | null {
  const mean = chartMean(facts);
  const targetMean = chartMean(targets);
  const hits =
    metric === "protein"
      ? countChartHits(facts, targets, "atLeast")
      : metric === "kcal"
        ? countChartHits(facts, targets, "within", KCAL_HIT_RATIO)
        : null;

  return chartInsight([
    mean != null ? `Среднее ${formatMetricValue(metric, mean)}` : null,
    targetMean != null ? `цель ${formatMetricValue(metric, targetMean)}` : null,
    hits
      ? metric === "protein"
        ? `дотянул ${hits.hit} из ${hits.total}`
        : `около цели ${hits.hit} из ${hits.total}`
      : null,
  ]);
}

function weightInsight(values: number[]): string | null {
  const mean = chartMean(values);
  const span = chartSpan(values);
  return chartInsight([
    span
      ? `${formatBodyWeight(span.first)} → ${formatBodyWeight(span.last)} кг`
      : null,
    mean != null ? `среднее ${formatBodyWeight(mean)} кг` : null,
  ]);
}

function formatMetricValue(metric: NutritionMetric, value: number): string {
  return metric === "kcal"
    ? `${formatKcal(value)} ккал`
    : `${formatMacro(value)} г`;
}
