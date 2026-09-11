"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExercisesList } from "@/components/workout/exercises-list";
import { useExercisesScreen } from "@/components/workout/use-exercises-screen";
import { EXERCISES_EMPTY } from "@/lib/messages";
import { cn } from "@/lib/utils";

export function ExercisesScreen() {
  const {
    exercises,
    loading,
    error,
    load,
    busyId,
    query,
    setQuery,
    filtered,
    active,
    idle,
    toggleActive,
  } = useExercisesScreen();

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title="Упражнения"
        subtitle="Что делаешь и веса"
        backHref="/workouts"
      />

      <div className="px-4 pb-24">
        {loading ? <ScreenLoading /> : null}

        {!loading && error && exercises.length === 0 ? (
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
          <p className="animate-fade py-12 text-center text-lg text-muted-foreground">
            {EXERCISES_EMPTY}
          </p>
        ) : null}

        {!loading && exercises.length > 0 ? (
          <div className="animate-rise flex flex-col gap-8">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск упражнения"
              className="h-14 rounded-2xl text-base"
              inputMode="search"
              enterKeyHint="search"
            />
            {error ? (
              <p className="text-center text-base text-destructive">{error}</p>
            ) : null}
            {filtered.length === 0 ? (
              <p className="px-1 text-base text-muted-foreground">
                Ничего не нашлось.
              </p>
            ) : (
              <ExercisesList
                active={active}
                idle={idle}
                busyId={busyId}
                onToggle={(exercise) => void toggleActive(exercise)}
              />
            )}
          </div>
        ) : null}
      </div>

      <StickyActions>
        <Link
          href="/workouts/exercises/new"
          className={cn(buttonVariants(), "h-14 w-full gap-2 text-lg")}
        >
          <Plus className="size-5" aria-hidden />
          Новое упражнение
        </Link>
      </StickyActions>
    </div>
  );
}
