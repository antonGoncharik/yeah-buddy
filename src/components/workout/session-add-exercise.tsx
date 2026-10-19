"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { SheetFrame } from "@/components/layout/sheet-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cachedGet } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import type { ExerciseWithMax } from "@/lib/types";
import { readExercises } from "@/lib/workout/hub-payload";
import { exerciseShortLabel } from "@/lib/workout/labels";
import { foldExerciseName } from "@/lib/workout/muscle-catalog-map";

export function SessionAddExercise({
  takenIds,
  disabled,
  onAdd,
}: {
  takenIds: string[];
  disabled: boolean;
  onAdd: (exerciseId: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [exercises, setExercises] = useState<ExerciseWithMax[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    void cachedGet("/api/exercises?filter=all", (data) => {
      if (!cancelled) {
        setExercises(readExercises(data));
      }
      return true;
    })
      .catch(() => {
        if (!cancelled) {
          setError(LOAD_FAILED);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const taken = new Set(takenIds);
  const needle = foldExerciseName(query);
  const rows = exercises.filter((exercise) => {
    if (taken.has(exercise.id)) {
      return false;
    }
    if (needle === "") {
      return exercise.is_active;
    }
    return foldExerciseName(
      `${exercise.name} ${exercise.short_name ?? ""}`,
    ).includes(needle);
  });

  async function pick(id: string) {
    if (addingId) {
      return;
    }
    setAddingId(id);
    const ok = await onAdd(id);
    setAddingId(null);
    if (ok) {
      setOpen(false);
      setQuery("");
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full gap-2 text-base"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" aria-hidden />
        Добавить упражнение
      </Button>
      {open ? (
        <SheetFrame
          title="Добавить упражнение"
          onCancel={() => {
            if (addingId == null) {
              setOpen(false);
            }
          }}
        >
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
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
                onClick={() => void pick(exercise.id)}
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
      ) : null}
    </>
  );
}
