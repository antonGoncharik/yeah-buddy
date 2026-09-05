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
  const shape = chartShape(points, 64, 28, 2);
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
        className="stroke-primary"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ProgressChart({ points }: { points: ProgressPoint[] }) {
  const width = 320;
  const height = 168;
  const shape = chartShape(points, width, height, 16);
  if (!shape) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Пока одна точка — кривая появится после смены фазы.
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
        aria-label="Прогресс максимумов"
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
        <path d={shape.area} fill="url(#progress-fill)" />
        <path
          d={shape.line}
          fill="none"
          className="stroke-primary"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {shape.dots.map((dot, index) => (
          <circle
            key={`${dot.x}-${dot.y}`}
            cx={dot.x}
            cy={dot.y}
            r={index === shape.dots.length - 1 ? 5 : 3.5}
            className="fill-primary"
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

function chartShape(
  points: ProgressPoint[],
  width: number,
  height: number,
  pad: number,
): {
  line: string;
  area: string;
  dots: Array<{ x: number; y: number }>;
  min: number;
  max: number;
  gridY: number[];
} | null {
  if (points.length === 0) {
    return null;
  }

  const weights = points.map((point) => point.weight);
  let min = Math.min(...weights);
  let max = Math.max(...weights);
  if (min === max) {
    min = min * 0.92;
    max = max * 1.08 || 1;
  }

  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const span = max - min;
  const step = points.length === 1 ? 0 : innerW / (points.length - 1);

  const dots = points.map((point, index) => {
    const x = pad + (points.length === 1 ? innerW / 2 : step * index);
    const y = pad + innerH - ((point.weight - min) / span) * innerH;
    return { x, y };
  });

  const line = dots
    .map((dot, index) => `${index === 0 ? "M" : "L"} ${dot.x} ${dot.y}`)
    .join(" ");
  const last = dots[dots.length - 1];
  const first = dots[0];
  if (!first || !last) {
    return null;
  }

  const area = `${line} L ${last.x} ${height - pad} L ${first.x} ${height - pad} Z`;
  const gridY = [pad, pad + innerH / 2, pad + innerH];

  return { line, area, dots, min, max, gridY };
}
