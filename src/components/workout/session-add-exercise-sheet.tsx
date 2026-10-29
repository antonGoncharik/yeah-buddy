"use client";

import Link from "next/link";

import { SheetFrame } from "@/components/layout/sheet-frame";
import { Input } from "@/components/ui/input";
import type { ExerciseWithMax } from "@/lib/types";
import { exerciseShortLabel } from "@/lib/workout/labels";

export function SessionAddExerciseSheet({
  query,
  onQueryChange,
  loading,
  error,
  exercises,
  rows,
  addingId,
  onCancel,
  onPick,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  loading: boolean;
  error: string | null;
  exercises: ExerciseWithMax[];
  rows: ExerciseWithMax[];
  addingId: string | null;
  onCancel: () => void;
  onPick: (id: string) => void;
}) {
  const needle = query.trim();

  return (
    <SheetFrame title="Добавить упражнение" onCancel={onCancel}>
      <Input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Название"
        className="h-12 text-base"
        autoComplete="off"
        enterKeyHint="search"
      />
      {loading ? (
        <p className="text-sm text-muted-foreground">Загружаю…</p>
      ) : null}
      {error ? <p className="text-base text-destructive">{error}</p> : null}
      {!loading && !error && rows.length === 0 ? (
        <p className="text-base text-muted-foreground">
          {exercises.length === 0
            ? "Пока нет упражнений."
            : needle
              ? "Ничего не нашлось."
              : "Все упражнения уже в тренировке."}
        </p>
      ) : null}
      <div className="flex max-h-64 min-h-40 flex-col overflow-y-auto">
        {rows.map((exercise) => (
          <button
            key={exercise.id}
            type="button"
            className="min-h-11 rounded-lg px-1 text-left text-base font-medium disabled:opacity-50"
            disabled={addingId != null}
            onClick={() => onPick(exercise.id)}
          >
            {addingId === exercise.id
              ? "Добавляю…"
              : exerciseShortLabel(exercise.short_name, exercise.name)}
            {exercise.is_active ? null : (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                не делаю
              </span>
            )}
          </button>
        ))}
      </div>
      <Link
        href="/workouts/exercises"
        className="py-2 text-center text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
      >
        Новое упражнение
      </Link>
    </SheetFrame>
  );
}
