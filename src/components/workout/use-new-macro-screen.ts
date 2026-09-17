"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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
  WorkoutTemplateDetail,
} from "@/lib/types";
import { withCycle } from "@/lib/workout/cycle";
import { readExercises, readTemplates } from "@/lib/workout/hub-payload";
import { readWorkoutSettingsPayload } from "@/lib/workout/map-settings";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";
import { slotNeedsMax } from "@/lib/workout/slot-plan";

type MaxDraft = Record<string, string>;

/** Exercises in the queue whose plan uses a percent of 1ПМ. */
function queueExercises(
  exercises: ExerciseWithMax[],
  templates: WorkoutTemplateDetail[],
): ExerciseWithMax[] {
  const catalog = new Map(
    exercises.map((exercise) => [exercise.id, exercise] as const),
  );
  const needsMax = new Set<string>();
  for (const template of templates.filter((item) => item.is_active)) {
    for (const [index, exercise] of template.exercises.entries()) {
      const slot = template.slots[index];
      const full = catalog.get(exercise.id) ?? exercise;
      if (slotNeedsMax(slot?.plan ?? null, full)) {
        needsMax.add(exercise.id);
      }
    }
  }
  return exercises.filter((exercise) => needsMax.has(exercise.id));
}

export function useNewMacroScreen() {
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
      const [exerciseResponse, settingsResponse, templatesResponse] =
        await Promise.all([
          fetch("/api/exercises?filter=active"),
          fetch("/api/workout-settings"),
          fetch("/api/templates"),
        ]);
      if (
        !exerciseResponse.ok ||
        !settingsResponse.ok ||
        !templatesResponse.ok
      ) {
        throw new Error("load failed");
      }

      const exerciseData: unknown = await exerciseResponse.json();
      const settingsData: unknown = await settingsResponse.json();
      const templatesData: unknown = await templatesResponse.json();
      const list = queueExercises(
        readExercises(exerciseData),
        readTemplates(templatesData),
      );
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

  async function applyCycle(
    cycle: CyclePhaseDef[],
    extra?: { auto_end?: boolean; loop?: boolean },
  ) {
    if (!formulas) {
      return;
    }
    setApplying(true);
    setError(null);
    const next = withCycle(formulas, cycle, extra);
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
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setSaving(false);
    }
  }

  const cycle = formulas?.cycle ?? [];

  return {
    queueEmpty: !loading && !error && exercises.length === 0,
    exercises,
    formulas,
    startDate,
    setStartDate,
    note,
    setNote,
    maxes,
    setMaxes,
    loading,
    saving,
    applying,
    error,
    load,
    applyCycle,
    onSubmit,
    cycle,
  };
}
