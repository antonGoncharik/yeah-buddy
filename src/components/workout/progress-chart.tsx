import { chartShape } from "@/lib/chart-shape";
import type { ProgressPoint } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatWeight } from "@/lib/workout/numbers";

export function ProgressSparkline({
  points,
  className,
}: {
  points: ProgressPoint[];
  className?: string;
}) {
  const shape = chartShape(
    points.map((point) => point.weight),
    64,
    28,
    2,
  );
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

export function ProgressChart({ points }: { points: ProgressPoint[] }) {
  const width = 320;
  const height = 168;
  const shape = chartShape(
    points.map((point) => point.weight),
    width,
    height,
    16,
  );
  if (!shape) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Пока одна точка — кривая появится после следующих тренировок.
      </p>
    );
  }

  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-44 w-full overflow-visible"
        role="img"
        aria-label="Прогресс рабочих весов"
      >
        <defs>
          <linearGradient id="progress-fill" x1="0" x2="0" y1="0" y2="1">
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
        <path
          d={shape.area}
          fill="url(#progress-fill)"
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
        <text x="16" y="12" className="fill-muted-foreground text-[11px]">
          {formatWeight(shape.max)} кг
        </text>
        <text
          x="16"
          y={height - 4}
          className="fill-muted-foreground text-[11px]"
        >
          {formatWeight(shape.min)} кг
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
        {points.slice(-6).map((point) => (
          <li
            key={`${point.date}-${point.label}-${point.weight}`}
            className="flex items-baseline justify-between gap-3 text-sm"
          >
            <span className="truncate text-muted-foreground">
              {point.label}
            </span>
            <span className="font-medium">{formatWeight(point.weight)} кг</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
