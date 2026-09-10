import { chartShape } from "@/lib/chart-shape";
import type { PhaseType, ProgressPoint } from "@/lib/types";
import { cn } from "@/lib/utils";
import { phaseLabel } from "@/lib/workout/labels";
import { formatSeconds, formatWeight } from "@/lib/workout/numbers";
import {
  hasSecondsSeries,
  metricPoints,
  metricValues,
  type ProgressMetric,
} from "@/lib/workout/progress-stats";

export function ProgressSparkline({
  points,
  className,
}: {
  points: ProgressPoint[];
  className?: string;
}) {
  const metric: ProgressMetric = hasSecondsSeries(points)
    ? "seconds"
    : "weight";
  const shape = chartShape(metricValues(points, metric), 64, 28, 2);
  if (!shape) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <svg
      viewBox="0 0 64 28"
      className={cn("h-7 w-16 overflow-visible", className)}
      aria-hidden
    >
      <path d={shape.area} className="fill-primary/15" />
      <path
        d={shape.line}
        fill="none"
        className="stroke-primary motion-safe:animate-draw-line"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        pathLength={1}
      />
    </svg>
  );
}

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

  const unit = metric === "seconds" ? "с" : "кг";
  const formatValue = metric === "seconds" ? formatSeconds : formatWeight;
  const marks = phaseMarks(series, shape.dots, width, 16);

  return (
    <div className="flex flex-col gap-3">
      <svg
        key={metric}
        viewBox={`0 0 ${width} ${height}`}
        className="h-44 w-full overflow-visible"
        role="img"
        aria-label={
          metric === "seconds" ? "Прогресс удержания" : "Прогресс весов"
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
      <ol className="flex flex-col gap-1.5">
        {series.slice(-6).map((point) => (
          <li
            key={`${point.date}-${point.label}-${point.weight}-${point.seconds}`}
            className="flex items-baseline justify-between gap-3 text-sm"
          >
            <span className="truncate text-muted-foreground">
              {point.label}
            </span>
            <span className="font-medium">
              {formatValue(
                metric === "seconds" ? (point.seconds ?? 0) : point.weight,
              )}{" "}
              {unit}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function phaseMarks(
  points: ProgressPoint[],
  dots: Array<{ x: number; y: number }>,
  width: number,
  pad: number,
): Array<{ x: number; label: string; anchor: "start" | "middle" | "end" }> {
  const marks: Array<{
    x: number;
    label: string;
    anchor: "start" | "middle" | "end";
  }> = [];
  let previous: PhaseType | null = null;

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const dot = dots[index];
    if (!point || !dot || point.phase_type == null) {
      previous = point?.phase_type ?? null;
      continue;
    }

    if (point.phase_type !== previous) {
      marks.push({
        x: dot.x,
        label: phaseLabel(point.phase_type),
        anchor:
          dot.x < pad + 28
            ? "start"
            : dot.x > width - pad - 28
              ? "end"
              : "middle",
      });
    }
    previous = point.phase_type;
  }

  return marks;
}
