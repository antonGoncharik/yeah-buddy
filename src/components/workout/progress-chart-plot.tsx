import { ChartCaption, TrendPlot } from "@/components/chart/trend-plot";
import { BarbellDoodle } from "@/components/layout/doodles";
import type { phaseMarks } from "@/components/workout/progress-phase-marks";
import type { chartLayout, chartSeries, chartShape } from "@/lib/chart-shape";
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
  tonnageShape: ChartSeries | null;
  tonnageLayout: ChartLayout | null;
}) {
  const showTonnage = tonnageShape != null && tonnageLayout != null;
  const caption =
    metric === "seconds"
      ? "Как держал"
      : metric === "relative"
        ? "К весу тела"
        : showTonnage
          ? "Вес · тоннаж пунктиром"
          : "Рабочий вес";

  return (
    <div className="flex flex-col gap-3">
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
        maxLabel={`${formatValue(shape.dataMax)}${unit ? ` ${unit}` : ""}`}
        minLabel={`${formatValue(shape.dataMin)}${unit ? ` ${unit}` : ""}`}
        endLabel={lastLabel}
        extraMaxLabel={
          showTonnage ? formatTonnage(tonnageLayout.dataMax) : undefined
        }
      >
        {marks.map((mark) => (
          <g key={`phase-${mark.x}-${mark.label}`}>
            <line
              x1={mark.x}
              x2={mark.x}
              y1="28"
              y2={height - 16}
              className="stroke-muted-foreground/40"
              strokeWidth="1"
              strokeDasharray="4 3"
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
      <ChartCaption
        icon={<BarbellDoodle />}
      >
        {caption}
      </ChartCaption>
    </div>
  );
}
