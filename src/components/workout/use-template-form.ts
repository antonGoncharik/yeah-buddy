"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { patchJson, postJson } from "@/lib/api-cache";
import { CHECK_FIELDS, LOAD_FAILED, WORKOUT_NOT_FOUND } from "@/lib/messages";
import { isRecord } from "@/lib/read";
import type {
  ExerciseWithMax,
  SlotPlan,
  TemplateSlot,
  WorkoutKind,
  WorkoutTemplateDetail,
} from "@/lib/types";
import {
  readExercises as hubReadExercises,
  parseTemplateDetail,
} from "@/lib/workout/hub-payload";
import { normalizeSlotPlan } from "@/lib/workout/slot-plan";

export interface TemplateFormSlot {
  exercise: ExerciseWithMax;
  plan: SlotPlan | null;
}

export function useTemplateForm({ templateId }: { templateId?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<WorkoutKind>("dynamic");
  const [isActive, setIsActive] = useState(true);
  const [slots, setSlots] = useState<TemplateSlot[]>([]);
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
        setSlots(template.slots);
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
    setSlots((current) =>
      current.some((slot) => slot.exercise_id === id)
        ? current.filter((slot) => slot.exercise_id !== id)
        : [...current, { exercise_id: id, plan: null }],
    );
  }

  function reorder(exerciseIds: string[]) {
    setSlots((current) =>
      exerciseIds.flatMap((id) => {
        const slot = current.find((item) => item.exercise_id === id);
        return slot ? [slot] : [];
      }),
    );
  }

  function setSlotPlan(exerciseId: string, plan: SlotPlan | null) {
    setSlots((current) =>
      current.map((slot) =>
        slot.exercise_id === exerciseId ? { ...slot, plan } : slot,
      ),
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
        slots: slots.map((slot) => ({
          exercise_id: slot.exercise_id,
          plan: normalizeSlotPlan(slot.plan),
        })),
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

  const selected = slots.flatMap<TemplateFormSlot>((slot) => {
    const exercise = catalog.find((item) => item.id === slot.exercise_id);
    return exercise ? [{ exercise, plan: slot.plan }] : [];
  });
  const selectedIds = new Set(slots.map((slot) => slot.exercise_id));
  const available = catalog.filter((exercise) => !selectedIds.has(exercise.id));

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
    reorder,
    setSlotPlan,
    onSubmit,
  };
}

function readTemplate(data: unknown): WorkoutTemplateDetail | null {
  return parseTemplateDetail(isRecord(data) ? data.template : null);
}
