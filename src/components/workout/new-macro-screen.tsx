"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { ScreenLoading } from "@/components/layout/screen-status";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { patchJson, postJson, writeJson } from "@/lib/api-cache";
import {
  LOAD_FAILED,
  NEED_ALL_WORKING_WEIGHTS,
  NEED_CYCLE_PHASES,
} from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import type {
  CyclePhaseDef,
  ExerciseWithMax,
  WorkoutFormulas,
} from "@/lib/types";
import { withCycle } from "@/lib/workout/cycle";
import { CYCLE_TEMPLATES } from "@/lib/workout/default-formulas";
import { readExercises } from "@/lib/workout/hub-payload";
import { readWorkoutSettingsPayload } from "@/lib/workout/map-settings";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

type MaxDraft = Record<string, string>;

export function NewMacroScreen() {
  const router = useRouter();
  const [exercises, setExercises] = useState<ExerciseWithMax[]>([]);
  const [formulas, setFormulas] = useState<WorkoutFormulas | null>(null);
  const [maxIncrease, setMaxIncrease] = useState(5);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");
  const [maxes, setMaxes] = useState<MaxDraft>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [exerciseResponse, settingsResponse] = await Promise.all([
        fetch("/api/exercises?filter=active"),
        fetch("/api/workout-settings"),
      ]);
      if (!exerciseResponse.ok || !settingsResponse.ok) {
        throw new Error("load failed");
      }

      const exerciseData: unknown = await exerciseResponse.json();
      const settingsData: unknown = await settingsResponse.json();
      const list = readExercises(exerciseData);
      const settings = readWorkoutSettingsPayload(settingsData);
      setExercises(list);
      setFormulas(settings?.formulas ?? null);
      setMaxIncrease(settings?.max_increase_percent ?? 5);
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
      setFormulas(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function applyCycle(cycle: CyclePhaseDef[]) {
    if (!formulas) {
      return;
    }
    setApplying(true);
    setError(null);
    const next = withCycle(formulas, cycle);
    try {
      const data = await patchJson("/api/workout-settings", {
        max_increase_percent: maxIncrease,
        formulas: next,
      });
      const settings = readWorkoutSettingsPayload(data);
      if (settings) {
        setFormulas(settings.formulas);
        writeJson("/api/workout-settings", data);
      } else {
        setFormulas(next);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setApplying(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formulas || formulas.cycle.length === 0) {
      haptic("warn");
      setError(NEED_CYCLE_PHASES);
      return;
    }

    const payloadMaxes = exercises.flatMap((exercise) => {
      const weight = parseDecimal(maxes[exercise.id] ?? "");
      if (weight == null || weight <= 0) {
        return [];
      }
      return [{ exercise_id: exercise.id, max_weight: weight }];
    });

    if (payloadMaxes.length !== exercises.length) {
      haptic("warn");
      setError(NEED_ALL_WORKING_WEIGHTS);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await postJson("/api/macros", {
        start_date: startDate,
        note: note.trim() === "" ? null : note.trim(),
        maxes: payloadMaxes,
      });
      haptic("success");
      router.push("/workouts/macro");
      router.refresh();
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setSaving(false);
    }
  }

  const cycle = formulas?.cycle ?? [];

  return (
    <div className="flex flex-col gap-4">
      <AppHeader title="Новый цикл" backHref="/workouts" />

      <div className="px-4 pb-24">
        {loading ? <ScreenLoading /> : null}

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
            {cycle.length === 0 ? (
              <section className="card-surface flex flex-col gap-3 px-5 py-4">
                <h2 className="text-xl font-semibold">Сначала этапы</h2>
                <p className="text-base leading-relaxed text-muted-foreground">
                  Выбери цикл или собери в подходах.
                </p>
                {CYCLE_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    disabled={applying || !formulas}
                    className="rounded-2xl border border-border/70 px-4 py-3 text-left transition-colors hover:bg-muted/40 disabled:opacity-60"
                    onClick={() => void applyCycle(template.cycle)}
                  >
                    <p className="text-base font-medium">{template.name}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {template.hint}
                    </p>
                  </button>
                ))}
                <Link
                  href="/settings/formulas"
                  className="text-base font-medium text-primary"
                >
                  Собрать свой в подходах
                </Link>
              </section>
            ) : (
              <>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {`${cycle.map((phase) => phase.name).join(" → ")}. Начнётся с «${cycle[0]?.name}». Веса ниже — что потянешь сейчас.`}
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
                  <h2 className="text-xl font-semibold">Твои веса</h2>
                  <p className="text-sm text-muted-foreground">
                    Стоят рекорды. Если давно не жалось — поставь меньше.
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
              </>
            )}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            {cycle.length > 0 ? (
              <StickyActions>
                <Button
                  type="submit"
                  className="h-14 text-lg"
                  disabled={saving}
                >
                  {saving ? "Создание…" : "Создать цикл"}
                </Button>
              </StickyActions>
            ) : null}
          </form>
        ) : null}
      </div>
    </div>
  );
}
