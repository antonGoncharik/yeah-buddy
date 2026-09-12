"use client";

import { useCallback, useEffect, useState } from "react";

import { useFormulasActions } from "@/components/workout/use-formulas-actions";
import { cachedGet } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import type { WorkoutFormulas, WorkoutKind } from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import { raisedMaxForPhase } from "@/lib/workout/cycle";
import { cloneFormulas } from "@/lib/workout/default-formulas";
import { previewMaxForPhase } from "@/lib/workout/formulas";
import { readWorkoutSettingsPayload } from "@/lib/workout/map-settings";
import { parseDecimal } from "@/lib/workout/numbers";

const SETTINGS_URL = "/api/workout-settings";

export function useFormulasScreen() {
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

  const actions = useFormulasActions({
    formulas,
    setFormulas,
    maxIncrease,
    setMaxIncrease,
    setCycleOpen,
    setError,
    setSaved,
    setSaving,
  });

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
    ...actions,
    exampleMax,
    exampleStep,
    increasePercent,
    showsIncrease,
    raisedExample,
    setSaved,
  };
}
