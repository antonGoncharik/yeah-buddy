"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExercisesList } from "@/components/workout/exercises-list";
import { useExercisesScreen } from "@/components/workout/use-exercises-screen";
import { EXERCISES_EMPTY } from "@/lib/messages";
import { cn } from "@/lib/utils";

export function ExercisesScreen() {
  const { exercises, loading, error, load, query, setQuery, filtered, groups } =
    useExercisesScreen();
  const searching = query.trim() !== "";

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title="Упражнения"
        subtitle="Что делаешь и 1ПМ"
        backHref="/workouts"
      />

      <div className="px-4 pb-28">
        {loading ? <ScreenLoading /> : null}

        {!loading && error && exercises.length === 0 ? (
          <ScreenError message={error} onRetry={() => void load()} />
        ) : null}

        {!loading && !error && exercises.length === 0 ? (
          <p className="animate-fade py-12 text-center text-lg text-muted-foreground">
            {EXERCISES_EMPTY}
          </p>
        ) : null}

        {!loading && exercises.length > 0 ? (
          <div className="animate-rise flex flex-col gap-6">
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
              <ExercisesList groups={groups} searching={searching} />
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
