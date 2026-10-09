"use client";

import type { MuscleBodyView, MuscleCell, MuscleId } from "@/lib/types";
import { cn } from "@/lib/utils";

const SILHOUETTE =
  "M60 18c8 0 14 7 14 15 0 6-3 11-8 13v6c14 4 24 18 26 34l4 42c1 8-4 15-12 16l-8 1c-6 1-11-3-13-9l-6-22-6 22c-2 6-7 10-13 9l-8-1c-8-1-13-8-12-16l4-42c2-16 12-30 26-34v-6c-5-2-8-7-8-13 0-8 6-15 14-15z";

const FRONT: Partial<Record<MuscleId, string>> = {
  chest:
    "M42 58c6-4 14-4 18 0 6 4 6 12 2 18l-6 8c-4 5-10 5-14 0l-6-8c-4-6-4-14 2-18 4-4 12-4 18 0z",
  front_delts:
    "M30 54c-6 2-10 8-8 14 2 4 6 6 10 4 4-2 6-8 4-14-2-4-4-6-6-4zm52 0c6 2 10 8 8 14-2 4-6 6-10 4-4-2-6-8-4-14 2-4 4-6 6-4z",
  side_delts:
    "M28 62c-4 6-3 14 2 18 3 2 6 0 6-4 0-6-2-12-6-14-2-1-2 0-2 0zm64 0c4 6 3 14-2 18-3 2-6 0-6-4 0-6 2-12 6-14 2-1 2 0 2 0z",
  biceps:
    "M24 78c-4 8-3 20 2 28 3 4 7 4 9 0 2-4 2-12 0-20-2-6-6-10-9-8zm72 0c4 8 3 20-2 28-3 4-7 4-9 0-2-4-2-12 0-20 2-6 6-10 9-8z",
  forearms:
    "M20 108c-3 10-2 24 4 32 3 4 6 2 7-2 1-6-1-16-4-24-2-4-5-8-7-6zm80 0c3 10 2 24-4 32-3 4-6 2-7-2-1-6 1-16 4-24 2-4 5-8 7-6z",
  abs: "M48 92h24c4 0 6 3 6 7v28c0 4-2 7-6 7h-24c-4 0-6-3-6-7v-28c0-4 2-7 6-7zm4 8v20h16v-20h-16z",
  quads:
    "M42 138c-6 0-10 8-10 20v36c0 8 4 14 10 14h8c4 0 8-6 8-14v-36c0-12-4-20-10-20h-8zm28 0c6 0 10 8 10 20v36c0 8-4 14-10 14h-8c-4 0-8-6-8-14v-36c0-12 4-20 10-20h8z",
  calves:
    "M44 206c-4 0-6 8-6 18v22c0 6 2 10 6 10h6c3 0 5-4 5-10v-22c0-10-2-18-6-18h-6zm22 0c4 0 6 8 6 18v22c0 6-2 10-6 10h-6c-3 0-5-4-5-10v-22c0-10 2-18 6-18h6z",
};

const BACK: Partial<Record<MuscleId, string>> = {
  upper_back:
    "M42 52c8-6 28-6 36 0 6 4 8 12 4 18l-8 10c-4 5-12 5-16 0l-8-10c-4-6-2-14 4-18z",
  rear_delts:
    "M26 58c-5 4-7 12-4 18 2 4 6 4 8 0 2-4 0-10-4-14-2-3-4-4-4-4zm68 0c5 4 7 12 4 18-2 4-6 4-8 0-2-4 0-10 4-14 2-3 4-4 4-4z",
  lats: "M34 72c-8 6-10 22-6 36 4 12 12 18 20 14 4-2 6-8 6-16 0-14-6-28-14-34-4-3-4-3-6 0zm52 0c8 6 10 22 6 36-4 12-12 18-20 14-4-2-6-8-6-16 0-14 6-28 14-34 4-3 4-3 6 0z",
  triceps:
    "M22 82c-4 10-2 24 4 30 4 4 8 2 9-2 1-6-2-16-6-24-2-4-5-6-7-4zm76 0c4 10 2 24-4 30-4 4-8 2-9-2-1-6 2-16 6-24 2-4 5-6 7-4z",
  lower_back:
    "M46 118h28c5 0 8 4 8 9v24c0 5-3 9-8 9h-28c-5 0-8-4-8-9v-24c0-5 3-9 8-9z",
  glutes:
    "M40 150c-4 0-8 6-8 14v16c0 8 6 14 14 14h8c4 0 8-4 8-10v-20c0-8-6-14-14-14h-8zm32 0c4 0 8 6 8 14v16c0 8-6 14-14 14h-8c-4 0-8-4-8-10v-20c0-8 6-14 14-14h8z",
  hamstrings:
    "M42 178c-6 0-10 8-10 18v32c0 8 4 12 10 12h8c4 0 8-6 8-14v-36c0-10-4-12-10-12h-6zm28 0c6 0 10 8 10 18v32c0 8-4 12-10 12h-8c-4 0-8-6-8-14v-36c0-10 4-12 10-12h6z",
  calves:
    "M44 232c-4 0-6 8-6 16v18c0 6 2 10 6 10h6c3 0 5-4 5-10v-18c0-8-2-16-6-16h-6zm22 0c4 0 6 8 6 16v18c0 6-2 10-6 10h-6c-3 0-5-4-5-10v-18c0-8 2-16 6-16h6z",
};

function fillForMuscle(cell: MuscleCell | undefined): string {
  if (!cell || cell.status === "idle") {
    return "var(--muted)";
  }
  const alpha = 0.22 + cell.load * 0.78;
  if (cell.status === "missed") {
    return `color-mix(in oklch, var(--destructive) ${Math.round(35 + cell.missed_sessions * 12)}%, var(--muted))`;
  }
  if (cell.status === "planned") {
    return "color-mix(in oklch, var(--primary) 28%, var(--muted))";
  }
  if (cell.status === "stale") {
    return `color-mix(in oklch, var(--primary) ${Math.round(alpha * 45)}%, var(--muted))`;
  }
  return `color-mix(in oklch, var(--primary) ${Math.round(alpha * 100)}%, var(--muted))`;
}

function strokeForMuscle(
  cell: MuscleCell | undefined,
  selected: boolean,
): string {
  if (selected) {
    return "var(--primary)";
  }
  if (cell?.status === "planned") {
    return "var(--primary)";
  }
  if (cell?.status === "missed") {
    return "color-mix(in oklch, var(--destructive) 70%, transparent)";
  }
  return "color-mix(in oklch, var(--foreground) 12%, transparent)";
}

export function MuscleBodyFigure({
  view,
  muscles,
  selectedId,
  onSelect,
}: {
  view: MuscleBodyView;
  muscles: MuscleCell[];
  selectedId: MuscleId | null;
  onSelect: (id: MuscleId) => void;
}) {
  const byId = new Map(muscles.map((item) => [item.id, item]));
  const paths = view === "front" ? FRONT : BACK;

  return (
    <svg
      viewBox="0 0 120 280"
      className="mx-auto h-auto w-full max-w-[220px] touch-none select-none"
      role="img"
      aria-label={view === "front" ? "Вид спереди" : "Вид сзади"}
    >
      <path
        d={SILHOUETTE}
        className="fill-muted/50 stroke-border/60"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      {(Object.entries(paths) as Array<[MuscleId, string]>).map(([id, d]) => {
        const cell = byId.get(id);
        const selected = selectedId === id;
        return (
          // biome-ignore lint/a11y/noStaticElementInteractions: svg muscle hit area
          <path
            key={id}
            d={d}
            aria-label={cell?.label ?? id}
            className={cn(
              "cursor-pointer transition-[fill,stroke,opacity] duration-200",
              cell?.status === "idle" && "opacity-55",
            )}
            fill={fillForMuscle(cell)}
            stroke={strokeForMuscle(cell, selected)}
            strokeWidth={selected ? 2.2 : 1}
            vectorEffect="non-scaling-stroke"
            onClick={() => onSelect(id)}
          />
        );
      })}
    </svg>
  );
}
