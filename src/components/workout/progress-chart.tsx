import { ProgressChartPlot } from "@/components/workout/progress-chart-plot";
import { phaseMarks } from "@/components/workout/progress-phase-marks";
import { chartLayout, chartSeries, chartShape } from "@/lib/chart-shape";
import { formatRelative } from "@/lib/day/body-weight";
import type { ProgressPoint } from "@/lib/types";
import {
  formatSeconds,
  formatTonnage,
  formatWeight,
} from "@/lib/workout/numbers";
import {
  metricPoints,
  metricValues,
  type ProgressMetric,
  tonnageOverlayValues,
} from "@/lib/workout/progress-stats";

export function ProgressChart({
  points,
  metric = "weight",
}: {
  points: ProgressPoint[];
  metric?: ProgressMetric;
}) {
  const series = metricPoints(points, metric);
  const width = 320;
  const height = 168;
  const shape = chartShape(metricValues(series, metric), width, height, 16);
  if (!shape) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Пока одна точка — кривая появится после следующих тренировок.
      </p>
    );
  }

  const last = series[series.length - 1];
  if (!last) {
    return null;
  }

  const unit = metric === "seconds" ? "с" : metric === "relative" ? "" : "кг";
  const formatValue =
    metric === "seconds"
      ? formatSeconds
      : metric === "relative"
        ? formatRelative
        : formatWeight;
  const marks = phaseMarks(series, shape.dots, width, 16);
  const tonnageValues =
    metric === "weight" ? tonnageOverlayValues(series) : null;
  const tonnageLayout = tonnageValues
    ? chartLayout(tonnageValues, series.length, width, height, 16)
    : null;
  const tonnageShape =
    tonnageLayout && tonnageValues
      ? chartSeries(tonnageValues, tonnageLayout)
      : null;

  return (
    <div className="flex flex-col gap-3">
      <ProgressChartPlot
        metric={metric}
        width={width}
        height={height}
        shape={shape}
        marks={marks}
        lastLabel={last.label}
        unit={unit}
        formatValue={formatValue}
        tonnageShape={tonnageShape}
        tonnageLayout={tonnageLayout}
      />
      <ol className="flex flex-col gap-1.5">
        {series.slice(-6).map((point) => (
          <li
            key={`${point.date}-${point.label}-${point.weight}-${point.seconds}-${point.relative}-${point.tonnage}`}
            className="flex items-baseline justify-between gap-3 text-sm"
          >
            <span className="truncate text-muted-foreground">
              {point.label}
            </span>
            <span className="shrink-0 font-medium tabular-nums">
              {formatValue(
                metric === "seconds"
                  ? (point.seconds ?? 0)
                  : metric === "relative"
                    ? (point.relative ?? 0)
                    : point.weight,
              )}
              {unit ? ` ${unit}` : ""}
              {metric === "weight" && point.tonnage != null
                ? ` · тоннаж ${formatTonnage(point.tonnage)}`
                : ""}
              {metric === "weight" &&
              point.circle_tonnage != null &&
              point.tonnage != null &&
              point.circle_tonnage !== point.tonnage
                ? ` · круг ${formatTonnage(point.circle_tonnage)}`
                : ""}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
