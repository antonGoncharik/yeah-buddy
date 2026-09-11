"use client";

import Link from "next/link";

import { AddRowButton } from "@/components/ui/add-row-button";
import { templateExerciseLine } from "@/components/workout/schedule-active-list";
import type { WorkoutTemplateDetail } from "@/lib/types";

export function ScheduleInactiveList({
  inactive,
  saving,
  onSetInCircle,
}: {
  inactive: WorkoutTemplateDetail[];
  saving: boolean;
  onSetInCircle: (id: string, inCircle: boolean) => void;
}) {
  if (inactive.length === 0) {
    return null;
  }

  return (
    <section className="animate-rise flex flex-col gap-2">
      <h2 className="px-1 text-lg font-semibold">Отложены</h2>
      <p className="px-1 text-sm leading-relaxed text-muted-foreground">
        Сейчас не в очереди. Можно вернуть или поправить.
      </p>
      <div className="overflow-hidden">
        {inactive.map((template) => (
          <div
            key={template.id}
            className="flex items-center gap-1 border-b border-border/70 px-1 py-1 last:border-b-0"
          >
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
            <AddRowButton
              label="В очередь"
              disabled={saving}
              onClick={() => onSetInCircle(template.id, true)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
