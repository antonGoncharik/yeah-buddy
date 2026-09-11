"use client";

import { useCallback, useEffect, useState } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import { toPayload } from "@/components/workout/formula-form";
import { cachedGet, patchJson, writeJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import type { CyclePhaseDef, WorkoutFormulas, WorkoutKind } from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import {
  applyWorkPattern,
  raisedMaxForPhase,
  withCycle,
} from "@/lib/workout/cycle";
import {
  cloneFormulas,
  DEFAULT_WORKOUT_FORMULAS,
  FORMULA_SYSTEMS,
} from "@/lib/workout/default-formulas";
import { previewMaxForPhase } from "@/lib/workout/formulas";
import { readWorkoutSettingsPayload } from "@/lib/workout/map-settings";
import { parseDecimal } from "@/lib/workout/numbers";

const SETTINGS_URL = "/api/workout-settings";

export function useFormulasScreen() {
  const confirm = useConfirm();
  const [kind, setKind] = useState<WorkoutKind>("dynamic");
  const [maxIncrease, setMaxIncrease] = useState("5");
  const [formulas, setFormulas] = useState<WorkoutFormulas | null>(null);
  const [cycleOpen, setCycleOpen] = useState(false);
  const [previewMax, setPreviewMax] = useState({
    dynamic: "220",
    static: "76",
  });
  const [previewStep, setPreviewStep] = useState({ dynamic: 2.5, static: 1 });
  const { loading, begin, done } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [advanced, setAdvanced] = useState(false);

  const load = useCallback(async () => {
    begin();
    setError(null);
    setSaved(false);

    try {
      await cachedGet(
        SETTINGS_URL,
        (data) => {
          const settings = readWorkoutSettingsPayload(data);
          if (!settings) {
            return false;
          }
          setFormulas(cloneFormulas(settings.formulas));
          setMaxIncrease(String(settings.max_increase_percent));
          setCycleOpen(settings.formulas.cycle.length > 0);
          return true;
        },
        () => done(true),
      );
      done(true);
    } catch {
      setError(LOAD_FAILED);
      setFormulas(null);
      done(false);
    }
  }, [begin, done]);

  useEffect(() => {
    void load();
  }, [load]);

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

  const exampleMax = parseDecimal(previewMax[kind]) ?? 0;
  const exampleStep = previewStep[kind];
  const increasePercent = parseDecimal(maxIncrease) ?? 0;
  const showsIncrease = Boolean(
    formulas?.cycle.some((phase) => phase.increase_on_end),
  );
  const raisedExample =
    exampleMax > 0 && showsIncrease
      ? previewMaxForPhase(
          formulas?.cycle ?? [],
          formulas?.cycle.find((phase) =>
            raisedMaxForPhase(formulas.cycle, phase.key),
          )?.key ?? "peak",
          exampleMax,
          increasePercent,
          exampleStep,
        )
      : exampleMax;

  return {
    kind,
    setKind,
    maxIncrease,
    setMaxIncrease,
    formulas,
    setFormulas,
    cycleOpen,
    setCycleOpen,
    previewMax,
    setPreviewMax,
    previewStep,
    setPreviewStep,
    loading,
    error,
    saved,
    saving,
    advanced,
    setAdvanced,
    load,
    onSave,
    restoreDefaults,
    applySystem,
    applyCycleTemplate,
    clearCycle,
    exampleMax,
    exampleStep,
    increasePercent,
    showsIncrease,
    raisedExample,
    setSaved,
  };
}
