"use client";

import type { MuscleCell, MuscleDisplayMode, MuscleId } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  muscleBandLabel,
  muscleCellHint,
  muscleHeatFill,
  muscleHeatRing,
  muscleVolumeBarStyle,
} from "@/lib/workout/muscle-heat-style";

export function MuscleHeatGrid({
  muscles,
  selectedId,
  displayMode,
  onSelect,
}: {
  muscles: MuscleCell[];
  selectedId: MuscleId | null;
  displayMode: MuscleDisplayMode;
  onSelect: (id: MuscleId) => void;
}) {
  const sorted = [...muscles].sort(
    (left, right) =>
      right.volume_band - left.volume_band ||
      right.sets_per_week - left.sets_per_week ||
      left.label.localeCompare(right.label, "ru"),
  );

  return (
    <ul className="grid grid-cols-2 gap-2">
      {sorted.map((cell) => {
        const selected = selectedId === cell.id;
        const barWidth =
          cell.volume_band === 0
            ? 0
            : Math.min(100, 12 + cell.volume_band * 22);
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
                    background: muscleHeatFill(cell, displayMode),
                    boxShadow: `0 0 0 2px ${muscleHeatRing(cell, selected)}`,
                  }}
                  aria-hidden
                />
              </span>
              <span className="text-xs text-muted-foreground">
                {displayMode === "recovery" && cell.recovery_percent != null
                  ? `Восст. ~${cell.recovery_percent}%`
                  : muscleCellHint(cell)}
              </span>
              {displayMode === "volume" ? (
                <span
                  className="h-1.5 overflow-hidden rounded-full bg-muted/90"
                  aria-hidden
                >
                  <span
                    className="block h-full rounded-full transition-[width] duration-300"
                    style={{
                      width: `${barWidth}%`,
                      ...muscleVolumeBarStyle(cell, displayMode),
                    }}
                  />
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  {`${muscleBandLabel(cell.volume_band)} · ~${cell.sets_per_week} в неделю`}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
