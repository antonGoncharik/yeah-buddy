import {
  ChartInsight,
  ChartLegend,
  TrendPlot,
} from "@/components/chart/trend-plot";
import type { chartLayout, chartSeries } from "@/lib/chart-shape";
import { formatIsoDate } from "@/lib/day/format";

export function NutritionTrendSvg({
  layout,
  factSeries,
  targetSeries,
  color,
  label,
  fillId,
  maxLabel,
  minLabel,
  lastDate,
  guideY,
  endValue,
  insight,
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
  guideY?: number;
  endValue?: string;
  insight?: string | null;
}) {
  return (
    <div className="flex flex-col gap-3">
      {insight ? <ChartInsight>{insight}</ChartInsight> : null}
      <TrendPlot
        layout={layout}
        series={factSeries}
        overlay={targetSeries}
        color={color}
        fillId={`food-${fillId}`}
        ariaLabel={`${label} по дням`}
        maxLabel={maxLabel}
        minLabel={minLabel}
        endLabel={formatIsoDate(lastDate, "d MMM")}
        guideY={guideY}
        endValue={endValue}
      />
      <ChartLegend
        items={[
          { label, color, swatch: "line" },
          ...(targetSeries ? [{ label: "Цель", swatch: "dash" as const }] : []),
        ]}
      />
    </div>
  );
}
