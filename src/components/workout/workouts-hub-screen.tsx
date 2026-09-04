"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  LOAD_FAILED,
  readApiError,
  WORKOUTS_NEED_EXERCISES,
} from "@/lib/messages";
import type {
  CurrentMacroState,
  ExerciseWithMax,
  WorkoutSession,
  WorkoutSlot,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  PHASE_TYPE_LABELS,
  SESSION_STATUS_LABELS,
  SLOT_ROTATION,
  WORKOUT_SLOT_LABELS,
} from "@/lib/workout/labels";
import { formatWeight } from "@/lib/workout/numbers";
import { isWorkoutSlot } from "@/lib/workout/slots";

export function WorkoutsHubScreen() {
  const date = format(new Date(), "yyyy-MM-dd");
  const [exercises, setExercises] = useState<ExerciseWithMax[]>([]);
  const [macro, setMacro] = useState<CurrentMacroState | null>(null);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [nextSlot, setNextSlot] = useState<WorkoutSlot>("a");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [exercisesResponse, macroResponse, todayResponse] =
        await Promise.all([
          fetch("/api/exercises?filter=active"),
          fetch("/api/macros"),
          fetch(`/api/sessions?date=${encodeURIComponent(date)}`),
        ]);
      if (!exercisesResponse.ok || !macroResponse.ok || !todayResponse.ok) {
        throw new Error("load failed");
      }

      const exercisesData: unknown = await exercisesResponse.json();
      const macroData: unknown = await macroResponse.json();
      const todayData: unknown = await todayResponse.json();
      setExercises(readExercises(exercisesData));
      setMacro(readMacro(macroData));
      setSession(readTodaySession(todayData));
      setNextSlot(readNextSlot(todayData));
    } catch {
      setError(LOAD_FAILED);
      setExercises([]);
      setMacro(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createToday(slot: WorkoutSlot) {
    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_date: date,
          slot,
        }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readApiError(data) ?? LOAD_FAILED);
        return;
      }

      await load();
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setCreating(false);
    }
  }

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

        {!loading && !error && exercises.length > 0 && !macro?.macro ? (
          <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-5">
            <h2 className="text-xl font-semibold">Макроцикл</h2>
            <p className="text-base text-muted-foreground">
              Максимумы уже подставлены из дневника — проверьте и начните
              разгон.
            </p>
            <Link
              href="/workouts/macro/new"
              className={cn(buttonVariants(), "h-14 text-lg")}
            >
              Создать макроцикл
            </Link>
          </section>
        ) : null}

        {!loading && !error && macro?.macro && macro.phase ? (
          <Link
            href="/workouts/macro"
            className="card-surface animate-rise block px-5 py-5 transition-colors hover:bg-muted/40"
          >
            <p className="text-sm text-muted-foreground">
              Макроцикл №{macro.macro.number}
            </p>
            <p className="text-2xl font-semibold">
              {PHASE_TYPE_LABELS[macro.phase.phase_type]}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              с {macro.phase.start_date}
            </p>
          </Link>
        ) : null}

        {!loading && !error && session ? (
          <Link
            href={`/workouts/sessions/${session.id}`}
            className="card-surface animate-rise block px-5 py-5 transition-colors hover:bg-muted/40"
          >
            <p className="text-sm text-muted-foreground">Сегодня</p>
            <p className="text-2xl font-semibold">
              {session.slot ? WORKOUT_SLOT_LABELS[session.slot] : "Тренировка"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {SESSION_STATUS_LABELS[session.status]}
            </p>
          </Link>
        ) : null}

        {!loading && !error && !session && macro?.macro ? (
          <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-5">
            <p className="text-sm text-muted-foreground">Следующий слот</p>
            <h2 className="text-2xl font-semibold">
              {WORKOUT_SLOT_LABELS[nextSlot]}
            </h2>
            <p className="text-base text-muted-foreground">
              Веса посчитаются сами. Можно взять другой слот — ротация подхватит
              с него.
            </p>
            <Button
              type="button"
              className="h-14 text-lg"
              disabled={creating}
              onClick={() => void createToday(nextSlot)}
            >
              Начать сегодня
            </Button>
            <div className="grid grid-cols-2 gap-2">
              {SLOT_ROTATION.map((slot) => (
                <Button
                  key={slot}
                  type="button"
                  variant={slot === nextSlot ? "secondary" : "outline"}
                  className="h-11 text-sm"
                  disabled={creating}
                  onClick={() => void createToday(slot)}
                >
                  {WORKOUT_SLOT_LABELS[slot]}
                </Button>
              ))}
            </div>
          </section>
        ) : null}

        {!loading && !error ? (
          <Link
            href="/workouts/schedule"
            className="text-sm font-medium text-primary"
          >
            Как устроена ротация
          </Link>
        ) : null}

        {!loading && !error && exercises.length > 0 ? (
          <>
            <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-xl font-semibold">Максимумы</h2>
                <Link
                  href="/workouts/exercises"
                  className="text-sm font-medium text-primary"
                >
                  Все упражнения
                </Link>
              </div>
              <ul className="flex flex-col gap-2">
                {exercises.slice(0, 8).map((exercise) => (
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

function readMacro(data: unknown): CurrentMacroState | null {
  if (!data || typeof data !== "object" || !("macro" in data)) {
    return null;
  }

  return data as CurrentMacroState;
}

function readTodaySession(data: unknown): WorkoutSession | null {
  if (
    !data ||
    typeof data !== "object" ||
    !("session" in data) ||
    !data.session
  ) {
    return null;
  }

  return data.session as WorkoutSession;
}

function readNextSlot(data: unknown): WorkoutSlot {
  if (
    data &&
    typeof data === "object" &&
    "next_slot" in data &&
    isWorkoutSlot(data.next_slot)
  ) {
    return data.next_slot;
  }

  return "a";
}
