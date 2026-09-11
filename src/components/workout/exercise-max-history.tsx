"use client";

import type { ExerciseWithMax } from "@/lib/types";
import { formatWeight } from "@/lib/workout/numbers";

export function ExerciseMaxHistory({
  exercise,
}: {
  exercise: ExerciseWithMax;
}) {
  if (exercise.max_history.length <= 1) {
    return null;
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-medium">Рекорды</h2>
      <ul className="card-surface divide-y divide-border/70">
        {exercise.max_history.map((record) => (
          <li
            key={record.id}
            className="flex items-center justify-between gap-3 px-5 py-3 text-base"
          >
            <span>{formatWeight(record.max_weight)} кг</span>
            <span className="text-sm text-muted-foreground">
              {record.achieved_at}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
