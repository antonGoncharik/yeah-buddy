"use client";

import type { Dispatch, SetStateAction } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import { toPayload } from "@/components/workout/formula-form";
import { patchJson, writeJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
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
  setCycleOpen,
  setError,
  setSaved,
  setSaving,
}: {
  formulas: WorkoutFormulas | null;
  setFormulas: Dispatch<SetStateAction<WorkoutFormulas | null>>;
  maxIncrease: string;
  setMaxIncrease: Dispatch<SetStateAction<string>>;
  setCycleOpen: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setSaved: Dispatch<SetStateAction<boolean>>;
  setSaving: Dispatch<SetStateAction<boolean>>;
}) {
  const confirm = useConfirm();

  async function onSave() {
    if (!formulas) {
      return;
    }

    const payload = toPayload(maxIncrease, formulas);
    if (!payload) {
      setError("Проверь проценты, подходы и повторы.");
      setSaved(false);
      return;
    }

    setError(null);
    setSaved(false);
    setSaving(true);

    try {
      const data = await patchJson(SETTINGS_URL, payload);
      const settings = readWorkoutSettingsPayload(data);
      if (settings) {
        setFormulas(cloneFormulas(settings.formulas));
        setMaxIncrease(String(settings.max_increase_percent));
        writeJson(SETTINGS_URL, data);
      }
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setSaving(false);
    }
  }

  async function restoreDefaults() {
    const ok = await confirm({
      message: "Вернуть 3×5 без этапов? Сейчас всё заменится.",
      confirmLabel: "Вернуть",
      cancelLabel: "Оставить",
    });
    if (!ok) {
      return;
    }
    setFormulas(cloneFormulas(DEFAULT_WORKOUT_FORMULAS));
    setMaxIncrease("5");
    setCycleOpen(false);
    setSaved(false);
    setError(null);
  }

  async function applySystem(id: (typeof FORMULA_SYSTEMS)[number]["id"]) {
    const system = FORMULA_SYSTEMS.find((item) => item.id === id);
    if (!system || !formulas) {
      return;
    }
    const ok = await confirm({
      message: formulas.cycle.length
        ? `Поставить «${system.name}»? Рабочие в этапах тоже сменятся, сами этапы останутся.`
        : `Поставить «${system.name}»? Текущие подходы заменятся.`,
      confirmLabel: "Поставить",
      cancelLabel: "Оставить",
    });
    if (!ok) {
      return;
    }
    setFormulas(applyWorkPattern(formulas, system.formulas));
    setSaved(false);
    setError(null);
  }

  async function applyCycleTemplate(cycle: CyclePhaseDef[], name: string) {
    if (!formulas) {
      return;
    }
    const ok = await confirm({
      message: `Поставить цикл «${name}»? Этапы и рабочие в них заменятся.`,
      confirmLabel: "Поставить",
      cancelLabel: "Оставить",
    });
    if (!ok) {
      return;
    }
    setFormulas(withCycle(formulas, cycle));
    setCycleOpen(true);
    setSaved(false);
    setError(null);
  }

  async function clearCycle() {
    if (!formulas) {
      return;
    }
    const ok = await confirm({
      message: "Убрать этапы? Веса всегда как в рабочих ниже.",
      confirmLabel: "Убрать",
      cancelLabel: "Оставить",
    });
    if (!ok) {
      return;
    }
    setFormulas(withCycle(formulas, []));
    setSaved(false);
    setError(null);
  }

  return {
    onSave,
    restoreDefaults,
    applySystem,
    applyCycleTemplate,
    clearCycle,
  };
}
