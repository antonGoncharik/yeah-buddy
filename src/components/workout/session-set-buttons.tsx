"use client";

import { Check } from "lucide-react";
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
  onToggleDone,
  renderAfter,
  memoryLine,
}: {
  sets: WorkoutSet[];
  drafts?: Record<string, SetDraft>;
  showActual: boolean;
  disabled: boolean;
  tone: "warmup" | "work";
  /** Sets whose editor is open; drawn as selected. */
  openIds?: string[];
  onPick: (ids: string[]) => void;
  /** Mark a working set done and let the caller start rest. */
  onToggleDone?: (set: WorkoutSet) => void;
  /** Rendered right under a set, e.g. the editor for the tapped one. */
  renderAfter?: (set: WorkoutSet) => ReactNode;
  /** Shown under each work set label, e.g. last session result. */
  memoryLine?: string | null;
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
        const line = open ? (
          <>
            <span className="w-5 shrink-0 text-sm font-medium tabular-nums text-primary">
              {index + 1}
            </span>
            <span className="min-w-0 text-xl font-semibold tracking-tight text-primary tabular-nums">
              {labels[index]}
            </span>
            {rirLabels[index] ? (
              <span className="text-sm text-muted-foreground">
                {rirLabels[index]}
              </span>
            ) : null}
          </>
        ) : (
          <>
            <span
              className={cn(
                "w-5 shrink-0 text-sm tabular-nums",
                "text-muted-foreground",
              )}
            >
              {index + 1}
            </span>
            <span
              className={cn(
                "tabular-nums",
                tone === "work"
                  ? "min-w-0 text-xl font-semibold tracking-tight"
                  : "text-base text-muted-foreground",
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
            <div className="flex items-center">
              {onToggleDone && !disabled ? (
                <SetDoneButton
                  done={set.is_completed}
                  label={
                    set.is_completed
                      ? `Подход ${index + 1} сделан`
                      : `Отметить подход ${index + 1}`
                  }
                  onClick={() => onToggleDone(set)}
                />
              ) : null}
              {disabled ? (
                <div className="flex min-h-11 w-full items-center gap-2.5 rounded-lg">
                  {line}
                </div>
              ) : (
                <button
                  type="button"
                  aria-expanded={open}
                  className={cn(
                    "-mx-2 flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 text-left transition-colors",
                    open ? "" : "hover:bg-muted/50",
                  )}
                  onClick={() => onPick([set.id])}
                >
                  {line}
                </button>
              )}
            </div>
            {tone === "work" && memoryLine && !open ? (
              <p
                className={cn(
                  "text-xs leading-snug text-muted-foreground",
                  onToggleDone && !disabled ? "pl-[4.25rem]" : "pl-7",
                )}
              >
                {memoryLine}
              </p>
            ) : null}
            {open ? renderAfter?.(set) : null}
          </li>
        );
      })}
    </ol>
  );
}

function SetDoneButton({
  done,
  label,
  onClick,
}: {
  done: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={done}
      aria-label={label}
      className="flex size-11 shrink-0 items-center justify-center"
      onClick={onClick}
    >
      <span
        className={cn(
          "flex size-6 items-center justify-center rounded-full border-2",
          done
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/45",
        )}
      >
        {done ? <Check className="size-3.5" strokeWidth={3} /> : null}
      </span>
    </button>
  );
}
