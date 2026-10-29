"use client";

import { ProgressExerciseCard } from "@/components/workout/progress-exercise-card";
import type { ExerciseProgress, StrengthProgress } from "@/lib/types";
import { isNewPeak } from "@/lib/workout/progress-control";

export function ProgressExerciseList({
  progress,
  shown,
  openId,
  onToggleOpen,
  hiddenCount,
  onShowRest,
}: {
  progress: StrengthProgress;
  shown: ExerciseProgress[];
  openId: string | null;
  onToggleOpen: (exerciseId: string) => void;
  hiddenCount: number;
  onShowRest: () => void;
}) {
  if (shown.length === 0 && hiddenCount === 0) {
    return null;
  }

  return (
    <>
      <ul className="animate-rise flex flex-col gap-2">
        {shown.map((item) => {
          const lifetime = progress.exercises.find(
            (row) => row.exercise_id === item.exercise_id,
          );
          return (
            <li key={item.exercise_id}>
              <ProgressExerciseCard
                item={item}
                record={lifetime ? isNewPeak(lifetime, item) : false}
                open={openId === item.exercise_id}
                onToggle={() => onToggleOpen(item.exercise_id)}
              />
            </li>
          );
        })}
      </ul>
      {hiddenCount > 0 ? (
        <button
          type="button"
          className="h-12 text-base font-medium text-muted-foreground"
          onClick={onShowRest}
        >
          Ещё {hiddenCount}
        </button>
      ) : null}
    </>
  );
}
