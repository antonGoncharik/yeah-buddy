"use client";

import type { SharePackDetail } from "@/lib/share/types";
import { WORKOUT_KIND_LABELS } from "@/lib/workout/labels";

export function PackWorkoutsPreview({ pack }: { pack: SharePackDetail }) {
  const workouts = pack.workouts;
  if (!workouts) {
    return null;
  }

  return (
    <>
      <p className="px-1 text-sm text-muted-foreground">
        Схема весов {workouts.formula_hint}
      </p>
      {workouts.days.map((day) => (
        <section
          key={day.name}
          className="card-surface animate-rise flex flex-col gap-2 px-5 py-4"
        >
          <h2 className="text-lg font-semibold">{day.name}</h2>
          <p className="text-sm text-muted-foreground">
            {WORKOUT_KIND_LABELS[day.kind]}
          </p>
          <p className="text-sm leading-relaxed">{day.exercises.join(" · ")}</p>
        </section>
      ))}
    </>
  );
}
