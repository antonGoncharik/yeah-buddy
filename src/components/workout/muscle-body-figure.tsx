"use client";

import type { ReactNode } from "react";

import type { MuscleBodyView, MuscleCell, MuscleId } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  muscleHeatFill,
  muscleHeatRing,
} from "@/lib/workout/muscle-heat-style";

interface MarkerAnchor {
  id: MuscleId;
  x: number;
  y: number;
}

const FRONT_ANCHORS: MarkerAnchor[] = [
  { id: "chest", x: 50, y: 58 },
  { id: "front_delts", x: 32, y: 50 },
  { id: "front_delts", x: 68, y: 50 },
  { id: "side_delts", x: 26, y: 54 },
  { id: "side_delts", x: 74, y: 54 },
  { id: "biceps", x: 22, y: 72 },
  { id: "biceps", x: 78, y: 72 },
  { id: "forearms", x: 18, y: 98 },
  { id: "forearms", x: 82, y: 98 },
  { id: "abs", x: 50, y: 84 },
  { id: "quads", x: 43, y: 132 },
  { id: "quads", x: 57, y: 132 },
  { id: "calves", x: 43, y: 182 },
  { id: "calves", x: 57, y: 182 },
];

const BACK_ANCHORS: MarkerAnchor[] = [
  { id: "upper_back", x: 50, y: 56 },
  { id: "rear_delts", x: 30, y: 50 },
  { id: "rear_delts", x: 70, y: 50 },
  { id: "lats", x: 34, y: 72 },
  { id: "lats", x: 66, y: 72 },
  { id: "triceps", x: 22, y: 76 },
  { id: "triceps", x: 78, y: 76 },
  { id: "lower_back", x: 50, y: 94 },
  { id: "glutes", x: 50, y: 118 },
  { id: "hamstrings", x: 43, y: 150 },
  { id: "hamstrings", x: 57, y: 150 },
  { id: "calves", x: 43, y: 182 },
  { id: "calves", x: 57, y: 182 },
];

const OUTLINE: Record<MuscleBodyView, ReactNode> = {
  front: (
    <g
      fill="color-mix(in oklch, var(--muted) 55%, transparent)"
      stroke="color-mix(in oklch, var(--foreground) 18%, transparent)"
      strokeWidth="1.2"
      vectorEffect="non-scaling-stroke"
    >
      <ellipse cx="50" cy="21" rx="10.5" ry="12" />
      <path d="M38 34c0-3 4-5 12-5s12 2 12 5v4c5 2 9 6 11 11l3 38c1 6-3 11-9 11H33c-6 0-10-5-9-11l3-38c2-5 6-9 11-11v-4z" />
      <path
        d="M38 34c-8 2-12 8-12 16v22c0 6 3 10 8 10s7-4 7-10V48c0-4 2-7 5-9"
        fill="none"
      />
      <path
        d="M62 34c8 2 12 8 12 16v22c0 6-3 10-8 10s-7-4-7-10V48c0-4-2-7-5-9"
        fill="none"
      />
      <path d="M42 98v58c0 8 3 14 8 14s8-6 8-14v-58" fill="none" />
      <path d="M58 98v58c0 8-3 14-8 14s-8-6-8-14v-58" fill="none" />
    </g>
  ),
  back: (
    <g
      fill="color-mix(in oklch, var(--muted) 55%, transparent)"
      stroke="color-mix(in oklch, var(--foreground) 18%, transparent)"
      strokeWidth="1.2"
      vectorEffect="non-scaling-stroke"
    >
      <ellipse cx="50" cy="21" rx="10.5" ry="12" />
      <path d="M38 34c0-3 4-5 12-5s12 2 12 5v4c5 2 9 6 11 11l3 38c1 6-3 11-9 11H33c-6 0-10-5-9-11l3-38c2-5 6-9 11-11v-4z" />
      <path
        d="M38 34c-8 2-12 8-12 16v22c0 6 3 10 8 10s7-4 7-10V48c0-4 2-7 5-9"
        fill="none"
      />
      <path
        d="M62 34c8 2 12 8 12 16v22c0 6-3 10-8 10s-7-4-7-10V48c0-4-2-7-5-9"
        fill="none"
      />
      <path d="M42 98v58c0 8 3 14 8 14s8-6 8-14v-58" fill="none" />
      <path d="M58 98v58c0 8-3 14-8 14s-8-6-8-14v-58" fill="none" />
    </g>
  ),
};

function markerRadius(cell: MuscleCell | undefined, selected: boolean): number {
  if (selected) {
    return 7;
  }
  if (!cell || cell.status === "idle") {
    return 4;
  }
  return 4.5 + cell.load * 2;
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
  const anchors = view === "front" ? FRONT_ANCHORS : BACK_ANCHORS;

  return (
    <svg
      viewBox="0 0 100 220"
      className="mx-auto h-auto w-full max-w-[180px] touch-none select-none"
      role="img"
      aria-label={view === "front" ? "Схема спереди" : "Схема сзади"}
    >
      {OUTLINE[view]}
      {anchors.map((anchor) => {
        const cell = byId.get(anchor.id);
        const selected = selectedId === anchor.id;
        const r = markerRadius(cell, selected);
        return (
          // biome-ignore lint/a11y/noStaticElementInteractions: svg marker
          <g
            key={`${anchor.id}-${anchor.x}-${anchor.y}`}
            className="cursor-pointer"
            onClick={() => onSelect(anchor.id)}
          >
            <circle
              cx={anchor.x}
              cy={anchor.y}
              r={r + 2.5}
              fill="none"
              stroke={muscleHeatRing(cell, selected)}
              strokeWidth={selected ? 2 : 1}
              vectorEffect="non-scaling-stroke"
              className={cn(
                "transition-[stroke-width] duration-200",
                cell?.status === "idle" && "opacity-40",
              )}
            />
            <circle
              cx={anchor.x}
              cy={anchor.y}
              r={r}
              fill={muscleHeatFill(cell)}
              className="transition-[r,fill] duration-200"
            />
          </g>
        );
      })}
    </svg>
  );
}
