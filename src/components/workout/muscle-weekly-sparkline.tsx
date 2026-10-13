"use client";

import type { MuscleCell } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MuscleWeeklySparkline({
  cell,
  className,
}: {
  cell: MuscleCell;
  className?: string;
}) {
  const values = cell.weekly_sets;
  if (values.length === 0) {
    return null;
  }
  const max = Math.max(...values, 1);
  const w = 120;
  const h = 36;
  const step = values.length > 1 ? w / (values.length - 1) : w;

  const points = values
    .map((value, index) => {
      const x = values.length > 1 ? index * step : w / 2;
      const y = h - (value / max) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("h-9 w-full max-w-[140px] text-primary", className)}
      role="img"
      aria-label="Подходы по неделям"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        opacity={0.85}
      />
      {values.map((value, index) => {
        const x = values.length > 1 ? index * step : w / 2;
        const y = h - (value / max) * (h - 4) - 2;
        return (
          <circle
            key={`pt-${x}-${y}`}
            cx={x}
            cy={y}
            r={2.5}
            fill="currentColor"
            opacity={value > 0 ? 1 : 0.25}
          />
        );
      })}
    </svg>
  );
}
