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
  const showTonnage = tonnageShape != null && tonnageLayout != null;

  return (
    <div className="flex flex-col gap-3">
      <svg
        key={metric}
        viewBox={`0 0 ${width} ${height}`}
        className="h-44 w-full overflow-visible"
        role="img"
        aria-label={
          metric === "seconds"
            ? "Прогресс удержания"
            : metric === "relative"
              ? "Прогресс к весу тела"
              : showTonnage
                ? "Прогресс весов и тоннажа"
                : "Прогресс весов"
        }
      >
        <defs>
          <linearGradient
            id={`progress-fill-${metric}`}
            x1="0"
            x2="0"
            y1="0"
            y2="1"
          >
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {shape.gridY.map((y) => (
          <line
            key={y}
            x1="16"
            x2={width - 16}
            y1={y}
            y2={y}
            className="stroke-border/80"
            strokeWidth="1"
          />
        ))}
        {marks.map((mark) => (
          <line
            key={`phase-${mark.x}-${mark.label}`}
            x1={mark.x}
            x2={mark.x}
            y1="28"
            y2={height - 16}
            className="stroke-muted-foreground/45"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
        ))}
        <path
          d={shape.area}
          fill={`url(#progress-fill-${metric})`}
          className="origin-bottom motion-safe:animate-fade"
        />
        <path
          d={shape.line}
          fill="none"
          className="stroke-primary motion-safe:animate-draw-line"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength={1}
        />
        {showTonnage ? (
          <path
            d={tonnageShape.line}
            fill="none"
            className="stroke-muted-foreground motion-safe:animate-draw-line"
            strokeWidth="1.75"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray="5 4"
            pathLength={1}
          />
        ) : null}
        {shape.dots.map((dot, index) => (
          <circle
            key={`${dot.x}-${dot.y}`}
            cx={dot.x}
            cy={dot.y}
            r={index === shape.dots.length - 1 ? 5 : 3.5}
            className="fill-primary motion-safe:animate-fade"
            style={{ animationDelay: `${120 + index * 40}ms` }}
          />
        ))}
        {showTonnage
          ? tonnageShape.dots.map((dot, index) => (
              <circle
                key={`t-${dot.x}-${dot.y}`}
                cx={dot.x}
                cy={dot.y}
                r={index === tonnageShape.dots.length - 1 ? 3.5 : 2.5}
                className="fill-muted-foreground motion-safe:animate-fade"
                style={{ animationDelay: `${140 + index * 40}ms` }}
              />
            ))
          : null}
        {marks.map((mark) => (
          <text
            key={`label-${mark.x}-${mark.label}`}
            x={mark.x}
            y="22"
            textAnchor={mark.anchor}
            className="fill-muted-foreground text-[10px]"
          >
            {mark.label}
          </text>
        ))}
        <text x="16" y="12" className="fill-muted-foreground text-[11px]">
          {formatValue(shape.max)} {unit}
        </text>
        {showTonnage ? (
          <text
            x={width - 16}
            y="12"
            textAnchor="end"
            className="fill-muted-foreground text-[11px]"
          >
            {formatTonnage(tonnageLayout.max)}
          </text>
        ) : null}
        <text
          x="16"
          y={height - 4}
          className="fill-muted-foreground text-[11px]"
        >
          {formatValue(shape.min)} {unit}
        </text>
        <text
          x={width - 16}
          y={height - 4}
          textAnchor="end"
          className="fill-muted-foreground text-[11px]"
        >
          {last.label}
        </text>
      </svg>
      {showTonnage ? (
        <p className="text-[11px] text-muted-foreground">кг · тоннаж</p>
      ) : null}
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
