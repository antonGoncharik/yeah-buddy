"use client";

import type { ReactNode } from "react";

import {
  formatVisibleSetLine,
  type SetDraft,
  visibleSetRirLabel,
} from "@/components/workout/session-drafts";
import type { WorkoutSet } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SessionSetButtons({
  sets,
  drafts,
  showActual,
  disabled,
  tone,
  openIds = [],
  onPick,
  renderAfter,
}: {
  sets: WorkoutSet[];
  drafts?: Record<string, SetDraft>;
  showActual: boolean;
  disabled: boolean;
  tone: "warmup" | "work";
  /** Sets whose editor is open; drawn as selected. */
  openIds?: string[];
  onPick: (ids: string[]) => void;
  /** Rendered right under a set, e.g. the editor for the tapped one. */
  renderAfter?: (set: WorkoutSet) => ReactNode;
}) {
  const labels = sets.map((set) =>
    formatVisibleSetLine(set, drafts?.[set.id], { showActual }),
  );
  const rirLabels = sets.map((set) =>
    tone === "work"
      ? visibleSetRirLabel(set, drafts?.[set.id], showActual)
      : null,
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
          <li
            key={set.id}
            className={cn(
              "flex flex-col gap-1",
              open && "-mx-2 rounded-xl bg-primary/8 px-2 py-1",
            )}
          >
            {disabled ? (
              <div className="flex min-h-11 w-full items-center gap-2.5 rounded-lg">
                {line}
              </div>
            ) : (
              <button
                type="button"
                aria-expanded={open}
                className={cn(
                  "-mx-2 flex min-h-11 items-center gap-2.5 rounded-lg px-2 text-left transition-colors",
                  open ? "" : "hover:bg-muted/50",
                )}
                onClick={() => onPick([set.id])}
              >
                {line}
              </button>
            )}
            {open ? renderAfter?.(set) : null}
          </li>
        );
      })}
    </ol>
  );
}
