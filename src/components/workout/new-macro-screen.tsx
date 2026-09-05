"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LOAD_FAILED, readApiError } from "@/lib/messages";
import type { ExerciseWithMax } from "@/lib/types";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

type MaxDraft = Record<string, string>;

export function NewMacroScreen() {
  const router = useRouter();
  const [exercises, setExercises] = useState<ExerciseWithMax[]>([]);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");
  const [maxes, setMaxes] = useState<MaxDraft>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      const list = readExercises(data);
      setExercises(list);
      setMaxes(
        Object.fromEntries(
          list.map((exercise) => [
            exercise.id,
            exercise.current_max
              ? formatWeight(exercise.current_max.max_weight)
              : "",
          ]),
        ),
      );
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

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payloadMaxes = exercises.flatMap((exercise) => {
      const weight = parseDecimal(maxes[exercise.id] ?? "");
      if (weight == null || weight <= 0) {
        return [];
      }
      return [{ exercise_id: exercise.id, max_weight: weight }];
    });

    if (payloadMaxes.length !== exercises.length) {
      setError("Задайте максимум для каждого упражнения.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/macros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_date: startDate,
          note: note.trim() === "" ? null : note.trim(),
          maxes: payloadMaxes,
        }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(readApiError(data) ?? LOAD_FAILED);
        return;
      }

      router.push("/workouts/macro");
      router.refresh();
    } catch {
      setError(LOAD_FAILED);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Новый макроцикл" backHref="/workouts" />

      <div className="px-4 pb-4">
        {loading ? (
          <p className="py-12 text-center text-muted-foreground">Загрузка…</p>
        ) : null}

        {!loading && error && exercises.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <p className="text-center font-medium">{error}</p>
            <Button
              className="h-12 min-w-40 text-base"
              onClick={() => void load()}
            >
              Повторить
            </Button>
          </div>
        ) : null}

        {!loading && exercises.length > 0 ? (
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <p className="text-base leading-relaxed text-muted-foreground">
              Первый макроцикл начинается с разгона. Максимумы — рабочие, от них
              считаются веса. Дальше фазы закрываешь сам после круга в зале.
            </p>
            <div className="flex flex-col gap-2">
              <Label className="text-base">Дата начала</Label>
              <Input
                type="date"
                required
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="h-12 text-base"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-base">Примечание</Label>
              <Input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="h-12 text-base"
              />
            </div>

            <section className="flex flex-col gap-3">
              <h2 className="text-xl font-semibold">Максимумы</h2>
              <p className="text-sm text-muted-foreground">
                Для первого макроцикла задай максимум каждого упражнения.
                Подставлены текущие рекорды — их можно поправить.
              </p>
              {exercises.map((exercise) => (
                <div key={exercise.id} className="flex flex-col gap-2">
                  <Label className="text-base">
                    {exercise.short_name || exercise.name}
                  </Label>
                  <Input
                    required
                    inputMode="decimal"
                    value={maxes[exercise.id] ?? ""}
                    onChange={(event) =>
                      setMaxes((current) => ({
                        ...current,
                        [exercise.id]: event.target.value,
                      }))
                    }
                    className="h-12 text-base"
                  />
                </div>
              ))}
            </section>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" className="h-14 text-lg" disabled={saving}>
              {saving ? "Создание…" : "Создать макроцикл"}
            </Button>
          </form>
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
