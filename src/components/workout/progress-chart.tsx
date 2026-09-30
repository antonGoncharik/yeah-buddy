import { ChartEmpty } from "@/components/chart/trend-plot";
import { ProgressChartPlot } from "@/components/workout/progress-chart-plot";
import { phaseMarks } from "@/components/workout/progress-phase-marks";
import { chartShape } from "@/lib/chart-shape";
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
} from "@/lib/workout/progress-stats";
import { PROGRESS_SESSION_WEIGHT_HINT } from "@/lib/workout/user-copy";

export function ProgressChart({
  points,
  metric = "weight",
}: {
  points: ProgressPoint[];
  metric?: ProgressMetric;
}) {
  const series = metricPoints(points, metric);
  const width = 320;
  const height = 176;
  const shape = chartShape(metricValues(series, metric), width, height, 16);
  if (!shape) {
    return <ChartEmpty>Ещё тренировка — и будет линия.</ChartEmpty>;
  }

  const last = series[series.length - 1];
  if (!last) {
    return null;
  }

  const unit =
    metric === "seconds"
      ? "с"
      : metric === "relative"
        ? ""
        : metric === "tonnage"
          ? "кг"
          : "кг";
  const formatValue =
    metric === "seconds"
      ? formatSeconds
      : metric === "relative"
        ? formatRelative
        : metric === "tonnage"
          ? formatTonnage
          : formatWeight;
  const marks = phaseMarks(series, shape.dots, width, 16);

  return (
    <div className="flex flex-col gap-3">
      {metric === "weight" ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {PROGRESS_SESSION_WEIGHT_HINT}
        </p>
      ) : null}
      <ProgressChartPlot
        metric={metric}
        height={height}
        shape={shape}
        marks={marks}
        lastLabel={last.label}
        unit={unit}
        formatValue={formatValue}
        values={metricValues(series, metric)}
        tonnageShape={null}
        tonnageLayout={null}
      />
      <ol className="flex flex-col gap-1.5">
        {series.slice(-6).map((point) => (
          <li
            key={`${point.date}-${point.label}-${point.weight}-${point.seconds}-${point.relative}-${point.tonnage}`}
            className="flex items-baseline justify-between gap-3 text-sm"
          >
            <span className="truncate text-muted-foreground">
              {point.label}
              {point.from_plan ? " · как план" : ""}
            </span>
            <span className="shrink-0 font-medium tabular-nums">
              {formatValue(
                metric === "seconds"
                  ? (point.seconds ?? 0)
                  : metric === "relative"
                    ? (point.relative ?? 0)
                    : metric === "tonnage"
                      ? (point.tonnage ?? 0)
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
