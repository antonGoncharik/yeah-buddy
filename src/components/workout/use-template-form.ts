"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { patchJson, postJson } from "@/lib/api-cache";
import { CHECK_FIELDS, LOAD_FAILED, WORKOUT_NOT_FOUND } from "@/lib/messages";
import { isRecord } from "@/lib/read";
import type {
  ExerciseWithMax,
  WorkoutKind,
  WorkoutTemplateDetail,
} from "@/lib/types";
import {
  readExercises as hubReadExercises,
  parseTemplateDetail,
} from "@/lib/workout/hub-payload";

export function useTemplateForm({ templateId }: { templateId?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<WorkoutKind>("dynamic");
  const [isActive, setIsActive] = useState(true);
  const [exerciseIds, setExerciseIds] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<ExerciseWithMax[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const exercisesResponse = await fetch("/api/exercises?filter=active");
        if (!exercisesResponse.ok) {
          throw new Error("load failed");
        }
        const exercisesData: unknown = await exercisesResponse.json();
        const list = hubReadExercises(exercisesData);
        if (!cancelled) {
          setCatalog(list);
        }

        if (!templateId) {
          return;
        }

        const response = await fetch(`/api/templates/${templateId}`);
        if (response.status === 404) {
          if (!cancelled) {
            setError(WORKOUT_NOT_FOUND);
          }
          return;
        }
        if (!response.ok) {
          throw new Error("load failed");
        }

        const data: unknown = await response.json();
        const template = readTemplate(data);
        if (!template || cancelled) {
          return;
        }

        setName(template.name);
        setKind(template.kind);
        setIsActive(template.is_active);
        setExerciseIds(template.exercises.map((exercise) => exercise.id));
      } catch {
        if (!cancelled) {
          setError(LOAD_FAILED);
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
  }, [templateId]);

  function toggleExercise(id: string) {
    setExerciseIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(CHECK_FIELDS);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: trimmed,
        kind,
        is_active: isActive,
        exercise_ids: exerciseIds,
      };
      if (templateId) {
        await patchJson(`/api/templates/${templateId}`, payload);
      } else {
        await postJson("/api/templates", payload);
      }

      router.push("/workouts/schedule");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setSaving(false);
    }
  }

  const selected = exerciseIds.flatMap((id) => {
    const exercise = catalog.find((item) => item.id === id);
    return exercise ? [exercise] : [];
  });
  const available = catalog.filter(
    (exercise) => !exerciseIds.includes(exercise.id),
  );

  return {
    name,
    setName,
    kind,
    setKind,
    isActive,
    setIsActive,
    loading,
    saving,
    error,
    selected,
    available,
    toggleExercise,
    setExerciseIds,
    onSubmit,
  };
}

function readTemplate(data: unknown): WorkoutTemplateDetail | null {
  return parseTemplateDetail(isRecord(data) ? data.template : null);
}
