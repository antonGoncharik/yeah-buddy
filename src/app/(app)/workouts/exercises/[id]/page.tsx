"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { ExerciseForm } from "@/components/workout/exercise-form";
import { LOAD_FAILED } from "@/lib/messages";
import type { ExerciseWithMax } from "@/lib/types";

export default function EditExercisePage() {
  const params = useParams<{ id: string }>();
  const [reloadToken, setReloadToken] = useState(0);
  const [exercise, setExercise] = useState<ExerciseWithMax | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      void reloadToken;
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/exercises/${params.id}`);
        if (cancelled) {
          return;
        }

        if (response.status === 404) {
          setError("Упражнение не найдено.");
          setExercise(null);
          return;
        }

        if (!response.ok) {
          throw new Error("load failed");
        }

        const data: unknown = await response.json();
        setExercise(readExercise(data));
      } catch {
        if (!cancelled) {
          setError(LOAD_FAILED);
          setExercise(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [params.id, reloadToken]);

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Упражнение" backHref="/workouts/exercises" />
      <div className="px-4 pb-4">
        {loading ? (
          <p className="py-10 text-center text-muted-foreground">Загрузка…</p>
        ) : null}
        {!loading && error ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <p className="text-center font-medium">{error}</p>
            <Button
              className="h-12 min-w-40 text-base"
              onClick={() => setReloadToken((value) => value + 1)}
            >
              Повторить
            </Button>
          </div>
        ) : null}
        {!loading && exercise ? <ExerciseForm exercise={exercise} /> : null}
      </div>
    </div>
  );
}

function readExercise(data: unknown): ExerciseWithMax | null {
  if (
    !data ||
    typeof data !== "object" ||
    !("exercise" in data) ||
    !data.exercise
  ) {
    return null;
  }

  return data.exercise as ExerciseWithMax;
}
