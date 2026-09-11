"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { ExerciseWithMax } from "@/lib/types";
import { formatWeight } from "@/lib/workout/numbers";

export function ExercisesList({
  active,
  idle,
  busyId,
  onToggle,
}: {
  active: ExerciseWithMax[];
  idle: ExerciseWithMax[];
  busyId: string | null;
  onToggle: (exercise: ExerciseWithMax) => void;
}) {
  return (
    <>
      <ExerciseGroup
        title="Делаю"
        hint="Эти в зале."
        empty="Включи из списка ниже."
        exercises={active}
        busyId={busyId}
        actionLabel="Не делаю"
        onToggle={onToggle}
      />
      <ExerciseGroup
        title="Не делаю"
        hint="В плане не будет."
        empty="Все, что есть, в работе."
        exercises={idle}
        busyId={busyId}
        actionLabel="Делаю"
        onToggle={onToggle}
      />
    </>
  );
}

function ExerciseGroup({
  title,
  hint,
  empty,
  exercises,
  busyId,
  actionLabel,
  onToggle,
}: {
  title: string;
  hint: string;
  empty: string;
  exercises: ExerciseWithMax[];
  busyId: string | null;
  actionLabel: string;
  onToggle: (exercise: ExerciseWithMax) => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="px-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{hint}</p>
      </div>
      {exercises.length === 0 ? (
        <p className="px-1 py-2 text-base text-muted-foreground">{empty}</p>
      ) : (
        <ul className="flex flex-col">
          {exercises.map((exercise) => (
            <li
              key={exercise.id}
              className="border-b border-border/70 last:border-b-0"
            >
              <div className="flex items-center gap-2 py-2.5">
                <Link
                  href={`/workouts/exercises/${exercise.id}`}
                  className="flex min-w-0 flex-1 items-center justify-between gap-3 py-1"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-base font-medium">
                      {exercise.short_name || exercise.name}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    <span className="text-lg tabular-nums font-semibold tracking-tight">
                      {exercise.current_max
                        ? formatWeight(exercise.current_max.max_weight)
                        : "—"}
                    </span>
                    <ChevronRight
                      className="size-5 text-muted-foreground"
                      aria-hidden
                    />
                  </span>
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 shrink-0 px-2.5 text-sm"
                  disabled={busyId === exercise.id}
                  onClick={() => onToggle(exercise)}
                >
                  {actionLabel}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
