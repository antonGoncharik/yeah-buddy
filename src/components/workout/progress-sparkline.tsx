import { chartShape } from "@/lib/chart-shape";
import type { ProgressPoint } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  hasSecondsSeries,
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
