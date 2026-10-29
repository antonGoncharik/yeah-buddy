"use client";

import { haptic } from "@/lib/telegram/haptic";
import type { WorkoutSet } from "@/lib/types";
import { cn } from "@/lib/utils";
import { parseRir, type SetDraft } from "@/lib/workout/session-set-drafts";

const RESERVE_CHOICES = [0, 1, 2, 3] as const;

export function SessionSetReservePicker({
  set,
  draft,
  disabled,
  onDraft,
}: {
  set: WorkoutSet;
  draft: SetDraft;
  disabled: boolean;
  onDraft: (patch: Partial<SetDraft>) => void;
}) {
  const typedReserve = parseRir(draft.rir);
  const shownReserve = typedReserve ?? set.planned_rir;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-muted-foreground">Запас</span>
      <div className="grid grid-cols-4 gap-1.5">
        {RESERVE_CHOICES.map((choice) => {
          const selected = shownReserve === choice;
          return (
            <button
              key={choice}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              className={cn(
                "h-11 rounded-lg text-base font-medium disabled:opacity-50",
                selected
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-foreground",
              )}
              onClick={() => {
                if (typedReserve == null && set.planned_rir === choice) {
                  return;
                }
                haptic("tick");
                onDraft({
                  rir: typedReserve === choice ? "" : String(choice),
                });
              }}
            >
              {choice === 0 ? "отказ" : choice}
            </button>
          );
        })}
      </div>
    </div>
  );
}
