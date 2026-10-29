"use client";

import { RemoveRowButton } from "@/components/ui/remove-row-button";
import { SessionSwapSheet } from "@/components/workout/session-swap-sheet";
import type { SessionExerciseDetail } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SLOT_INTENSITY_LABELS } from "@/lib/workout/slot-plan";

export function SessionExerciseRowHeader({
  item,
  diaryCompact,
  disabled,
  templateId,
  onSwap,
  onOfferTemplate,
  onRemove,
}: {
  item: SessionExerciseDetail;
  diaryCompact: boolean;
  disabled: boolean;
  templateId: string | null;
  onSwap?: (sessionExerciseId: string, exerciseId: string) => Promise<boolean>;
  onOfferTemplate?: (offer: {
    fromExerciseId: string;
    exerciseId: string;
    name: string;
  }) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="flex w-full items-center gap-2">
      <h3
        className={cn(
          "min-w-0 flex-1 font-semibold tracking-tight",
          diaryCompact ? "text-base leading-tight" : "text-xl",
        )}
      >
        {item.exercise.short_name || item.exercise.name}
      </h3>
      {item.intensity ? (
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
            item.intensity === "heavy"
              ? "bg-destructive/12 text-destructive"
              : "bg-primary/12 text-primary",
          )}
        >
          {SLOT_INTENSITY_LABELS[item.intensity].toLowerCase()}
        </span>
      ) : null}
      {onSwap ? (
        <SessionSwapSheet
          sessionId={item.session_id}
          sessionExerciseId={item.id}
          fromExerciseId={item.exercise_id}
          templateId={templateId}
          disabled={disabled}
          onSwap={onSwap}
          onOfferTemplate={onOfferTemplate}
        />
      ) : null}
      {onRemove ? (
        <RemoveRowButton disabled={disabled} onClick={onRemove} />
      ) : null}
    </div>
  );
}
