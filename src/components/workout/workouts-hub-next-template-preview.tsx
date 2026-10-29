"use client";

import { AlignedPair } from "@/components/ui/aligned-pair";
import type { ExerciseWithMax, WorkoutTemplateDetail } from "@/lib/types";
import { templateExerciseLoadPreview } from "@/lib/workout/hints";
import { exercisesById } from "@/lib/workout/hub-view";
import { exerciseShortLabel } from "@/lib/workout/labels";
import { formatWeight } from "@/lib/workout/numbers";

export function WorkoutsHubNextTemplatePreview({
  template,
  exercises,
  phaseKey = null,
}: {
  template: WorkoutTemplateDetail;
  exercises: ExerciseWithMax[];
  phaseKey?: string | null;
}) {
  if (template.exercises.length === 0) {
    return null;
  }

  const catalog = exercisesById(exercises);

  return (
    <ul className="flex flex-col divide-y divide-border/60">
      {template.exercises.map((exercise) => {
        const full = catalog.get(exercise.id);
        const preview = full
          ? templateExerciseLoadPreview(template, full, phaseKey)
          : null;
        return (
          <li
            key={exercise.id}
            className="flex items-baseline justify-between gap-3 py-2 first:pt-0 last:pb-0"
          >
            <span className="min-w-0 truncate text-base">
              {exerciseShortLabel(exercise.short_name, exercise.name)}
            </span>
            <AlignedPair
              beside
              leading={
                preview ? (
                  <span className="text-base font-semibold">
                    {formatWeight(preview.value)}
                  </span>
                ) : null
              }
              trailing={
                <span className="text-sm font-medium text-muted-foreground">
                  {preview
                    ? preview.reps != null && preview.reps > 0
                      ? `× ${preview.reps}`
                      : "кг"
                    : "—"}
                </span>
              }
            />
          </li>
        );
      })}
    </ul>
  );
}
