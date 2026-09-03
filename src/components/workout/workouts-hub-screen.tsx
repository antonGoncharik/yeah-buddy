"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { LOAD_FAILED, WORKOUTS_NEED_EXERCISES } from "@/lib/messages";
import type { ExerciseWithMax } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatWeight } from "@/lib/workout/numbers";

export function WorkoutsHubScreen() {
  const [exercises, setExercises] = useState<ExerciseWithMax[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/exercises?filter=active");
      if (!response.ok) {
        throw new Error("load failed");
      }

      const data: unknown = await response.json();
      setExercises(readExercises(data));
    } catch {
      setError(LOAD_FAILED);
      setExercises([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Тренировки" />

      <div className="flex flex-col gap-4 px-4 pb-4">
        {loading ? (
          <p className="animate-fade py-12 text-center text-lg text-muted-foreground">
            Загрузка…
          </p>
        ) : null}

        {!loading && error ? (
          <div className="animate-rise flex flex-col items-center gap-3 py-12">
            <p className="text-center text-lg font-medium">{error}</p>
            <Button
              className="h-12 min-w-40 text-base"
              onClick={() => void load()}
            >
              Повторить
            </Button>
          </div>
        ) : null}

        {!loading && !error && exercises.length === 0 ? (
          <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-5">
            <p className="text-lg font-medium">{WORKOUTS_NEED_EXERCISES}</p>
            <Link
              href="/workouts/exercises/new"
              className={cn(buttonVariants(), "h-14 text-lg")}
            >
              Добавить упражнение
            </Link>
          </section>
        ) : null}

        {!loading && !error && exercises.length > 0 ? (
          <>
            <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-xl font-semibold">Рекорды</h2>
                <Link
                  href="/workouts/exercises"
                  className="text-sm font-medium text-primary"
                >
                  Все упражнения
                </Link>
              </div>
              <ul className="flex flex-col gap-2">
                {exercises.slice(0, 6).map((exercise) => (
                  <li
                    key={exercise.id}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <span className="truncate text-base">
                      {exercise.short_name || exercise.name}
                    </span>
                    <span className="shrink-0 text-base font-medium">
                      {exercise.current_max
                        ? `${formatWeight(exercise.current_max.max_weight)} кг`
                        : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <Link
              href="/workouts/exercises/new"
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "h-14 text-lg",
              )}
            >
              Добавить упражнение
            </Link>
          </>
        ) : null}
      </div>
    </div>
  );
}

function readExercises(data: unknown): ExerciseWithMax[] {
  if (
    !data ||
    typeof data !== "object" ||
    !("exercises" in data) ||
    !Array.isArray(data.exercises)
  ) {
    return [];
  }

  return data.exercises as ExerciseWithMax[];
}
