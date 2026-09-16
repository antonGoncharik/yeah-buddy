"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useFormulasActions } from "@/components/workout/use-formulas-actions";
import { cachedGet } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import type { WorkoutFormulas, WorkoutKind } from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import { cloneFormulas } from "@/lib/workout/default-formulas";
import { readTemplates } from "@/lib/workout/hub-payload";
import { readWorkoutSettingsPayload } from "@/lib/workout/map-settings";
import { parseDecimal } from "@/lib/workout/numbers";

const SETTINGS_URL = "/api/workout-settings";

/** Example 1ПМ for the kg column; only for display. */
const EXAMPLE_MAX: Record<WorkoutKind, string> = {
  dynamic: "100",
  static: "60",
};
const EXAMPLE_STEP: Record<WorkoutKind, number> = { dynamic: 2.5, static: 1 };

/**
 * Shared state for the set-scheme screens (main, warmup, cycle phases).
 * Each screen loads, edits and saves the whole `formulas` object.
 */
export function useFormulasScreen() {
  const [kind, setKind] = useState<WorkoutKind>("dynamic");
  const [maxIncrease, setMaxIncrease] = useState("5");
  const [formulas, setFormulas] = useState<WorkoutFormulas | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [hasStaticTemplates, setHasStaticTemplates] = useState(false);
  const [previewMax, setPreviewMax] = useState(EXAMPLE_MAX);
  const { loading, begin, done } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    begin();
    setError(null);
    setSaved(false);

    try {
      await Promise.all([
        cachedGet(
          SETTINGS_URL,
          (data) => {
            const settings = readWorkoutSettingsPayload(data);
            if (!settings) {
              return false;
            }
            const next = cloneFormulas(settings.formulas);
            const increase = String(settings.max_increase_percent);
            setFormulas(next);
            setMaxIncrease(increase);
            setSnapshot(serialize(next, increase));
            return true;
          },
          () => done(true),
        ),
        // Templates only decide whether the «На время» switch is shown.
        cachedGet("/api/templates", (data) => {
          setHasStaticTemplates(
            readTemplates(data).some((template) => template.kind === "static"),
          );
          return true;
        }).catch(() => undefined),
      ]);
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
    setError,
    setSaved,
    setSaving,
    onSaved: (next, increase) => setSnapshot(serialize(next, increase)),
  });

  const dirty = useMemo(
    () =>
      formulas != null &&
      snapshot != null &&
      serialize(formulas, maxIncrease) !== snapshot,
    [formulas, maxIncrease, snapshot],
  );

  const exampleMax = parseDecimal(previewMax[kind]) ?? 0;
  const exampleStep = EXAMPLE_STEP[kind];
  const increasePercent = parseDecimal(maxIncrease) ?? 0;

  return {
    kind,
    setKind,
    showKindSwitch: hasStaticTemplates || kind === "static",
    maxIncrease,
    setMaxIncrease,
    formulas,
    setFormulas,
    previewMax,
    setPreviewMax,
    exampleMax,
    exampleStep,
    increasePercent,
    loading,
    error,
    saved,
    saving,
    dirty,
    load,
    setSaved,
    ...actions,
  };
}

export type FormulasScreenState = ReturnType<typeof useFormulasScreen>;

function serialize(formulas: WorkoutFormulas, maxIncrease: string): string {
  return JSON.stringify({ formulas, maxIncrease: maxIncrease.trim() });
}
