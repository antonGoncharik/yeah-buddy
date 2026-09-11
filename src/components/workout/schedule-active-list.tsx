"use client";

import Link from "next/link";

import { RemoveRowButton } from "@/components/ui/remove-row-button";
import { SortableList } from "@/components/workout/sortable-list";
import type { WorkoutTemplateDetail } from "@/lib/types";
import { exerciseShortLabel } from "@/lib/workout/labels";

export function ScheduleActiveList({
  active,
  inactive,
  saving,
  onPersist,
  onSetInCircle,
}: {
  active: WorkoutTemplateDetail[];
  inactive: WorkoutTemplateDetail[];
  saving: boolean;
  onPersist: (
    nextActive: WorkoutTemplateDetail[],
    nextInactive: WorkoutTemplateDetail[],
  ) => void;
  onSetInCircle: (id: string, inCircle: boolean) => void;
}) {
  if (active.length === 0) {
    return null;
  }

  return (
    <section className="animate-rise flex flex-col gap-2">
      <p className="px-1 text-sm leading-relaxed text-muted-foreground">
        Нажми имя — упражнения.
      </p>
      <SortableList
        items={active}
        disabled={saving}
        onReorder={(nextActive) => onPersist(nextActive, inactive)}
        renderItem={(template) => (
          <>
            <Link
              href={`/workouts/templates/${template.id}`}
              className="min-w-0 flex-1 rounded-xl px-2 py-2"
            >
              <p className="text-base font-medium leading-snug">
                {template.name}
              </p>
              <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                {templateExerciseLine(template)}
              </p>
            </Link>
            <RemoveRowButton
              disabled={saving}
              onClick={() => onSetInCircle(template.id, false)}
            />
          </>
        )}
      />
    </section>
  );
}

export function templateExerciseLine(template: WorkoutTemplateDetail): string {
  if (template.exercises.length === 0) {
    return "Упражнений пока нет";
  }

  return template.exercises
    .map((exercise) => exerciseShortLabel(exercise.short_name, exercise.name))
    .join(" · ");
}
