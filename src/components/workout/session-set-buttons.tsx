"use client";

import type { WorkoutSet } from "@/lib/types";
import { formatSetLine, workSetDiffers } from "@/lib/workout/session-format";

export function SessionSetButtons({
  sets,
  showActual,
  disabled,
  tone,
  onPick,
}: {
  sets: WorkoutSet[];
  showActual: boolean;
  disabled: boolean;
  tone: "warmup" | "work";
  onPick: (ids: string[]) => void;
}) {
  const labels = sets.map((set) => formatSetLine(set, { showActual }));

  return (
    <div className="flex w-full flex-col gap-1">
      <ol className="flex flex-col gap-1.5">
        {sets.map((set, index) => (
          <li key={set.id}>
            <button
              type="button"
              className="flex w-full items-baseline gap-2.5 text-left disabled:opacity-60"
              disabled={disabled}
              onClick={() => onPick([set.id])}
            >
              <span className="w-5 shrink-0 text-sm tabular-nums text-muted-foreground">
                {index + 1}
              </span>
              <span
                className={
                  tone === "work"
                    ? "text-2xl font-semibold tracking-tight tabular-nums"
                    : "text-base tabular-nums text-muted-foreground"
                }
              >
                {labels[index]}
              </span>
            </button>
            {showActual && workSetDiffers(set) ? (
              <p className="mt-0.5 pl-7 text-sm text-muted-foreground">
                план {formatSetLine(set, { compact: true })}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
