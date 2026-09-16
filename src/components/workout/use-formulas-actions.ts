"use client";

import type { Dispatch, SetStateAction } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import { toPayload } from "@/components/workout/formula-form";
import { patchJson, writeJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import type { CyclePhaseDef, WorkoutFormulas } from "@/lib/types";
import { applyWorkPattern, withCycle } from "@/lib/workout/cycle";
import {
  cloneFormulas,
  DEFAULT_WORKOUT_FORMULAS,
  FORMULA_SYSTEMS,
} from "@/lib/workout/default-formulas";
import { readWorkoutSettingsPayload } from "@/lib/workout/map-settings";

const SETTINGS_URL = "/api/workout-settings";

export function useFormulasActions({
  formulas,
  setFormulas,
  maxIncrease,
  setMaxIncrease,
  setError,
  setSaved,
  setSaving,
  onSaved,
}: {
  formulas: WorkoutFormulas | null;
  setFormulas: Dispatch<SetStateAction<WorkoutFormulas | null>>;
  maxIncrease: string;
  setMaxIncrease: Dispatch<SetStateAction<string>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setSaved: Dispatch<SetStateAction<boolean>>;
  setSaving: Dispatch<SetStateAction<boolean>>;
  onSaved: (formulas: WorkoutFormulas, maxIncrease: string) => void;
}) {
  const confirm = useConfirm();

  /** Saves the whole scheme. Returns true when the server accepted it. */
  async function onSave(): Promise<boolean> {
    if (!formulas) {
      return false;
    }

    const payload = toPayload(maxIncrease, formulas);
    if (!payload) {
      haptic("warn");
      setError("Проверь проценты, подходы и повторы.");
      setSaved(false);
      return false;
    }

    setError(null);
    setSaved(false);
    setSaving(true);

    try {
      const data = await patchJson(SETTINGS_URL, payload);
      const settings = readWorkoutSettingsPayload(data);
      if (settings) {
        const next = cloneFormulas(settings.formulas);
        const increase = String(settings.max_increase_percent);
        setFormulas(next);
        setMaxIncrease(increase);
        onSaved(next, increase);
        writeJson(SETTINGS_URL, data);
      } else {
        onSaved(formulas, maxIncrease);
      }
      haptic("success");
      setSaved(true);
      return true;
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
      return false;
    } finally {
      setSaving(false);
    }
  }

  function touch(next: WorkoutFormulas) {
    setFormulas(next);
    setSaved(false);
    setError(null);
  }

  async function restoreDefaults() {
    const ok = await confirm({
      message:
        "Вернуть всё как было в начале: 3×5, обычная разминка, без этапов цикла?",
      confirmLabel: "Вернуть",
      cancelLabel: "Оставить",
    });
    if (!ok) {
      return;
    }
    touch(cloneFormulas(DEFAULT_WORKOUT_FORMULAS));
    setMaxIncrease("5");
  }

  function applySystem(id: (typeof FORMULA_SYSTEMS)[number]["id"]) {
    const system = FORMULA_SYSTEMS.find((item) => item.id === id);
    if (!system || !formulas) {
      return;
    }
    haptic("tap");
    touch(applyWorkPattern(formulas, system.formulas));
  }

  async function applyCycleTemplate(cycle: CyclePhaseDef[], name: string) {
    if (!formulas) {
      return;
    }
    if (formulas.cycle.length > 0) {
      const ok = await confirm({
        message: `Поставить «${name}» вместо текущих этапов? Свои подходы в этапах сбросятся, а схемы упражнений на прежние этапы перестанут работать.`,
        confirmLabel: "Поставить",
        cancelLabel: "Оставить",
      });
      if (!ok) {
        return;
      }
    }
    haptic("tap");
    touch(withCycle(formulas, cycle));
  }

  async function clearCycle() {
    if (!formulas) {
      return;
    }
    const ok = await confirm({
      message:
        "Убрать этапы? Вес всегда будет считаться от рабочих подходов, а схемы упражнений по неделям перестанут работать.",
      confirmLabel: "Убрать",
      cancelLabel: "Оставить",
      destructive: true,
    });
    if (!ok) {
      return;
    }
    touch(withCycle(formulas, []));
  }

  return {
    onSave,
    restoreDefaults,
    applySystem,
    applyCycleTemplate,
    clearCycle,
  };
}
