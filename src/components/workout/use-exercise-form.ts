"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  type ExerciseFormState,
  toFormState,
  toPayload,
} from "@/components/workout/exercise-form-state";
import {
  cachedGet,
  mutateJson,
  patchJson,
  peekJson,
  postJson,
} from "@/lib/api-cache";
import { CHECK_FIELDS, LOAD_FAILED } from "@/lib/messages";
import type { ExerciseWithMax, WorkoutTemplateDetail } from "@/lib/types";
import { exerciseLoadNeed } from "@/lib/workout/exercise-load-need";
import { readTemplates } from "@/lib/workout/hub-payload";

export function useExerciseForm(
  exercise?: ExerciseWithMax,
  initialName?: string,
) {
  const router = useRouter();
  const [form, setForm] = useState<ExerciseFormState>(() => {
    const state = toFormState(exercise);
    if (!exercise && initialName?.trim()) {
      return { ...state, name: initialName.trim() };
    }
    return state;
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [canCorrectMax, setCanCorrectMax] = useState(!exercise);
  const [active, setActive] = useState(exercise?.is_active !== false);
  const [toggling, setToggling] = useState(false);
  const [templates, setTemplates] = useState<WorkoutTemplateDetail[] | null>(
    () => {
      const cached = peekJson("/api/templates");
      return cached ? readTemplates(cached) : null;
    },
  );

  useEffect(() => {
    void cachedGet("/api/templates", (data) => {
      setTemplates(readTemplates(data));
      return true;
    });
  }, []);

  useEffect(() => {
    if (!exercise) {
      return;
    }

    let cancelled = false;

    async function loadMacro() {
      try {
        const data = await mutateJson("/api/macros");
        if (cancelled) {
          return;
        }

        const phase =
          data && typeof data === "object" && "phase" in data
            ? data.phase
            : true;
        setCanCorrectMax(phase == null);
      } catch {
        // Keep the field locked until we know there is no current phase.
      }
    }

    void loadMacro();

    return () => {
      cancelled = true;
    };
  }, [exercise]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const need = exercise
        ? exerciseLoadNeed(exercise, templates)
        : { max: form.formula_preset !== "none", track: false };
      const payload = toPayload(
        form,
        Boolean(exercise),
        canCorrectMax,
        need.max,
      );
      if (!payload) {
        setError(CHECK_FIELDS);
        return;
      }

      if (exercise) {
        await patchJson(`/api/exercises/${exercise.id}`, payload);
      } else {
        await postJson("/api/exercises", payload);
      }

      router.push("/workouts/exercises");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(nextActive: boolean) {
    if (!exercise || nextActive === active) {
      return;
    }

    setToggling(true);
    setError(null);

    try {
      await patchJson(`/api/exercises/${exercise.id}`, {
        archived: !nextActive,
      });
      setActive(nextActive);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setToggling(false);
    }
  }

  const need = exercise
    ? exerciseLoadNeed(exercise, templates)
    : { max: form.formula_preset !== "none", track: false };

  return {
    form,
    setForm,
    error,
    saving,
    canCorrectMax,
    active,
    toggling,
    need,
    onSubmit,
    toggleActive,
  };
}
