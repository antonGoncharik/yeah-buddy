"use client";

import type { MuscleCell, MuscleId } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  muscleHeatFill,
  muscleHeatRing,
  muscleStatusLabel,
} from "@/lib/workout/muscle-heat-style";

export function MuscleHeatGrid({
  muscles,
  selectedId,
  onSelect,
}: {
  muscles: MuscleCell[];
  selectedId: MuscleId | null;
  onSelect: (id: MuscleId) => void;
}) {
  const sorted = [...muscles].sort(
    (left, right) =>
      right.load - left.load || left.label.localeCompare(right.label, "ru"),
  );

  return (
    <ul className="grid grid-cols-2 gap-2">
      {sorted.map((cell) => {
        const selected = selectedId === cell.id;
        return (
          <li key={cell.id}>
            <button
              type="button"
              className={cn(
                "flex w-full flex-col gap-2 rounded-2xl border px-3 py-2.5 text-left transition-colors",
                selected
                  ? "border-primary bg-primary/5"
                  : "border-border/70 bg-card/40 hover:bg-muted/35",
              )}
              onClick={() => onSelect(cell.id)}
            >
              <span className="flex items-start justify-between gap-2">
                <span className="text-sm leading-snug font-medium">
                  {cell.label}
                </span>
                <span
                  className="mt-0.5 size-2.5 shrink-0 rounded-full ring-2 ring-offset-1 ring-offset-card"
                  style={{
                    background: muscleHeatFill(cell),
                    boxShadow: `0 0 0 2px ${muscleHeatRing(cell, selected)}`,
                  }}
                  aria-hidden
                />
              </span>
              <span className="text-xs text-muted-foreground">
                {muscleStatusLabel(cell.status)}
              </span>
              <span
                className="h-1.5 overflow-hidden rounded-full bg-muted/90"
                aria-hidden
              >
                <span
                  className="block h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${Math.round(Math.max(cell.load, cell.status === "idle" ? 0 : 0.12) * 100)}%`,
                    background: muscleHeatFill(cell),
                  }}
                />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
