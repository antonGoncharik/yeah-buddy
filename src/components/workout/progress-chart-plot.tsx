import {
  ChartInsight,
  ChartLegend,
  TrendPlot,
} from "@/components/chart/trend-plot";
import type { phaseMarks } from "@/components/workout/progress-phase-marks";
import type { chartLayout, chartSeries, chartShape } from "@/lib/chart-shape";
import { chartY } from "@/lib/chart-shape";
import { chartInsight, chartMean, chartSpan } from "@/lib/chart-stats";
import { formatTonnage } from "@/lib/workout/numbers";
import type { ProgressMetric } from "@/lib/workout/progress-stats";

type ChartShape = NonNullable<ReturnType<typeof chartShape>>;
type ChartSeries = NonNullable<ReturnType<typeof chartSeries>>;
type ChartLayout = NonNullable<ReturnType<typeof chartLayout>>;
type PhaseMark = ReturnType<typeof phaseMarks>[number];

export function ProgressChartPlot({
  metric,
  height,
  shape,
  marks,
  lastLabel,
  unit,
  formatValue,
  values,
  tonnageShape,
  tonnageLayout,
}: {
  metric: ProgressMetric;
  height: number;
  shape: ChartShape;
  marks: PhaseMark[];
  lastLabel: string;
  unit: string;
  formatValue: (value: number) => string;
  values: number[];
  tonnageShape: ChartSeries | null;
  tonnageLayout: ChartLayout | null;
}) {
  const showTonnage = tonnageShape != null && tonnageLayout != null;
  const seriesLabel =
    metric === "seconds"
      ? "Удержание"
      : metric === "relative"
        ? "К весу тела"
        : "Вес";
  const mean = chartMean(values);
  const last = values[values.length - 1];
  const withUnit = (value: number) =>
    `${formatValue(value)}${unit ? ` ${unit}` : ""}`;
  const insight = progressInsight(values, withUnit);

  return (
    <div className="flex flex-col gap-3">
      {insight ? <ChartInsight>{insight}</ChartInsight> : null}
      <TrendPlot
        layout={shape}
        series={shape}
        overlay={showTonnage ? tonnageShape : undefined}
        color="var(--primary)"
        fillId={`gym-${metric}`}
        ariaLabel={
          metric === "seconds"
            ? "Прогресс удержания"
            : metric === "relative"
              ? "Прогресс к весу тела"
              : showTonnage
                ? "Прогресс весов и тоннажа"
                : "Прогресс весов"
        }
        maxLabel={withUnit(shape.dataMax)}
        minLabel={withUnit(shape.dataMin)}
        endLabel={lastLabel}
        extraMaxLabel={
          showTonnage ? formatTonnage(tonnageLayout.dataMax) : undefined
        }
        guideY={
          mean != null && shape.dataMax !== shape.dataMin
            ? chartY(mean, shape)
            : undefined
        }
        endValue={last != null ? withUnit(last) : undefined}
      >
        {marks.map((mark) => (
          <g key={`phase-${mark.x}-${mark.label}`}>
            <line
              x1={mark.x}
              x2={mark.x}
              y1="28"
              y2={height - 16}
              className="stroke-muted-foreground/35"
              strokeWidth="1"
            />
            <text
              x={mark.x}
              y="22"
              textAnchor={mark.anchor}
              className="fill-muted-foreground text-[10px]"
            >
              {mark.label}
            </text>
          </g>
        ))}
      </TrendPlot>
      <ChartLegend
        items={[
          { label: seriesLabel, color: "var(--primary)", swatch: "line" },
          ...(showTonnage
            ? [{ label: "Тоннаж", swatch: "dash" as const }]
            : []),
        ]}
      />
    </div>
  );
}

function progressInsight(
  values: number[],
  format: (value: number) => string,
): string | null {
  const mean = chartMean(values);
  const span = chartSpan(values);
  return chartInsight([
    span && span.first !== span.last
      ? `${format(span.first)} → ${format(span.last)}`
      : null,
    mean != null ? `среднее ${format(mean)}` : null,
  ]);
}
