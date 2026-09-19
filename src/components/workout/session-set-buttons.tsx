"use client";

import type { ReactNode } from "react";

import type { WorkoutSet } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  formatSetLine,
  setCopiedFromPlan,
  setRirLabel,
  workSetDiffers,
} from "@/lib/workout/session-format";

export function SessionSetButtons({
  sets,
  showActual,
  showCopied = false,
  disabled,
  tone,
  openIds = [],
  onPick,
  renderAfter,
}: {
  sets: WorkoutSet[];
  showActual: boolean;
  /** When some sets were written, label the ones that still came from the plan. */
  showCopied?: boolean;
  disabled: boolean;
  tone: "warmup" | "work";
  /** Sets whose editor is open; drawn as selected. */
  openIds?: string[];
  onPick: (ids: string[]) => void;
  /** Rendered right under a set, e.g. the editor for the tapped one. */
  renderAfter?: (set: WorkoutSet) => ReactNode;
}) {
  const labels = sets.map((set) => formatSetLine(set, { showActual }));
  const rirLabels = sets.map((set) =>
    tone === "work" ? setRirLabel(set, showActual) : null,
  );

  return (
    <ol className="flex w-full flex-col gap-1">
      {sets.map((set, index) => {
        const open = openIds.includes(set.id);
        const line = (
          <>
            <span
              className={cn(
                "w-5 shrink-0 text-sm tabular-nums",
                open ? "text-primary" : "text-muted-foreground",
              )}
            >
              {index + 1}
            </span>
            <span
              className={cn(
                "tabular-nums",
                tone === "work"
                  ? "text-2xl font-semibold tracking-tight"
                  : "text-base text-muted-foreground",
                open && "text-primary",
              )}
            >
              {labels[index]}
            </span>
            {rirLabels[index] ? (
              <span className="text-sm text-muted-foreground">
                {rirLabels[index]}
              </span>
            ) : null}
          </>
        );

        return (
          <li key={set.id} className="flex flex-col gap-1">
            {disabled ? (
              <div className="flex w-full items-baseline gap-2.5 rounded-lg py-0.5">
                {line}
              </div>
            ) : (
              <button
                type="button"
                aria-expanded={open}
                className={cn(
                  "-mx-2 flex items-baseline gap-2.5 rounded-lg px-2 py-0.5 text-left transition-colors",
                  open ? "bg-primary/8" : "hover:bg-muted/50",
                )}
                onClick={() => onPick([set.id])}
              >
                {line}
              </button>
            )}
            {showActual && workSetDiffers(set) ? (
              <p className="-mt-1 pl-7 text-sm text-muted-foreground">
                план {formatSetLine(set, { compact: true })}
              </p>
            ) : showActual && showCopied && setCopiedFromPlan(set) ? (
              <p className="-mt-1 pl-7 text-sm text-muted-foreground">
                как план
              </p>
            ) : null}
            {open ? renderAfter?.(set) : null}
          </li>
        );
      })}
    </ol>
  );
}
