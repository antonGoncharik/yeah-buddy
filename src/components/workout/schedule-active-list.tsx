"use client";

import Link from "next/link";

import { SectionHeading } from "@/components/layout/section-heading";
import { RemoveRowButton } from "@/components/ui/remove-row-button";
import { SortableList } from "@/components/workout/sortable-list";
import type { WorkoutTemplateDetail } from "@/lib/types";
import { exerciseShortLabel } from "@/lib/workout/labels";
import {
  formatSlotGroup,
  SLOT_INTENSITY_LABELS,
  slotFor,
} from "@/lib/workout/slot-plan";

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
      <SectionHeading
        title="В программе"
        hint={
          active.length > 1
            ? "Потяни за номер слева — порядок дней. Крестик откладывает."
            : "Крестик откладывает, не удаляет."
        }
      />
      <div className="card-surface px-3 py-1">
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
                label="Отложить"
                disabled={saving}
                onClick={() => onSetInCircle(template.id, false)}
              />
            </>
          )}
        />
      </div>
    </section>
  );
}

export function templateExerciseLine(template: WorkoutTemplateDetail): string {
  if (template.exercises.length === 0) {
    return "Упражнений пока нет";
  }

  return template.exercises
    .map((exercise) => {
      const label = exerciseShortLabel(exercise.short_name, exercise.name);
      const plan = slotFor(template.slots, exercise.id);
      const scheme = plan?.groups
        ? plan.groups.map(formatSlotGroup).join(", ")
        : null;
      const tag = plan?.intensity
        ? SLOT_INTENSITY_LABELS[plan.intensity].toLowerCase()
        : null;
      const extra = [scheme, tag].filter(Boolean).join(" · ");
      return extra ? `${label} (${extra})` : label;
    })
    .join(" · ");
}
