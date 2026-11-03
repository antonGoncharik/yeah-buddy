"use client";

import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";

import { cachedGet, mutateJson, postJson, writeJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import type { CurrentMacroState, TransitionPreview } from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import { parseCurrentMacroState } from "@/lib/workout/hub-payload";
import type { MacroAdvanceStep } from "@/lib/workout/macro-advance-copy";
import { parseTransitionPreview } from "@/lib/workout/map-rows";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

const SETTINGS_URL = "/api/macros";

export function useMacroScreen() {
  const [state, setState] = useState<CurrentMacroState | null>(null);
  const { loading, begin, done } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<TransitionPreview | null>(null);
  const [transitionDate, setTransitionDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [advancing, setAdvancing] = useState(false);
  const [advanceStep, setAdvanceStep] = useState<MacroAdvanceStep | null>(null);
  const [justClosed, setJustClosed] = useState(false);

  const applyState = useCallback((next: CurrentMacroState) => {
    setState(next);
    setDrafts({});
  }, []);

  const load = useCallback(async () => {
    begin();
    setError(null);

    try {
      await cachedGet(
        SETTINGS_URL,
        (data) => {
          const next = readState(data);
          if (!next) {
            return false;
          }
          applyState(next);
          return true;
        },
        () => done(true),
      );
      done(true);
    } catch {
      setError(LOAD_FAILED);
      setState(null);
      done(false);
    }
  }, [applyState, begin, done]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const phaseId = state?.phase?.id;
    if (!phaseId) {
      return;
    }

    let cancel = false;
    setPreview(null);
    void mutateJson("/api/macros/transition")
      .then((data) => {
        if (!cancel) {
          setPreview(readPreview(data));
        }
      })
      .catch(() => {
        if (!cancel) {
          setPreview(null);
        }
      });

    return () => {
      cancel = true;
    };
  }, [state?.phase?.id]);

  function changeDraft(exerciseId: string, value: string) {
    setDrafts((current) => ({ ...current, [exerciseId]: value }));
  }

  const rows = maxRows(state, preview);

  async function completeWeek() {
    if (!state?.phase || advancing) {
      return;
    }

    setAdvancing(true);
    setAdvanceStep("transition");
    setError(null);
    let ready = preview;
    if (!ready) {
      try {
        ready = readPreview(await mutateJson("/api/macros/transition"));
        setPreview(ready);
      } catch (caught) {
        setAdvancing(false);
        setAdvanceStep(null);
        haptic("error");
        setError(caught instanceof Error ? caught.message : LOAD_FAILED);
        return;
      }
    }
    if (!ready) {
      setAdvancing(false);
      setAdvanceStep(null);
      setError(LOAD_FAILED);
      return;
    }

    const maxes = collectNext(ready, drafts);
    if (!maxes) {
      setAdvancing(false);
      setAdvanceStep(null);
      haptic("warn");
      setError("Проверь максимум на раз.");
      return;
    }

    const previous = drafts;
    try {
      const closingMacro = ready.new_macro;
      const data = await postJson("/api/macros/transition", {
        end_date: transitionDate,
        maxes,
      });
      const next = readState(data);
      if (!next) {
        throw new Error(LOAD_FAILED);
      }
      writeJson(SETTINGS_URL, next);
      haptic("success");
      setJustClosed(closingMacro);
      applyState(next);
      setPreview(null);
    } catch (caught) {
      haptic("error");
      setDrafts(previous);
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setAdvancing(false);
      setAdvanceStep(null);
    }
  }

  return {
    state,
    loading,
    error,
    rows,
    drafts,
    nextTitle: nextTitle(state, preview),
    transitionDate,
    setTransitionDate,
    advancing,
    advanceStep,
    justClosed,
    load,
    changeDraft,
    completeWeek,
  };
}

function maxRows(
  state: CurrentMacroState | null,
  preview: TransitionPreview | null,
) {
  if (preview) {
    return preview.maxes.map((row) => ({
      exerciseId: row.exercise_id,
      name: row.name,
      current: row.current_weight,
      proposed: row.proposed_weight,
      note: row.note,
    }));
  }
  return (state?.maxes ?? []).flatMap((row) =>
    row.phase_max
      ? [
          {
            exerciseId: row.exercise.id,
            name: row.exercise.short_name || row.exercise.name,
            current: row.phase_max.max_weight,
            proposed: row.phase_max.max_weight,
            note: "",
          },
        ]
      : [],
  );
}

function nextTitle(
  state: CurrentMacroState | null,
  preview: TransitionPreview | null,
): string {
  if (preview?.new_macro) {
    return "новый цикл";
  }
  return (
    preview?.to_name ??
    state?.phase_circle?.next_phase_name ??
    "следующая неделя"
  );
}

function collectNext(
  preview: TransitionPreview,
  drafts: Record<string, string>,
): Array<{ exercise_id: string; max_weight: number }> | null {
  const maxes = [];
  for (const row of preview.maxes) {
    const weight = parseDecimal(
      drafts[row.exercise_id] ?? formatWeight(row.proposed_weight),
    );
    if (weight == null || weight <= 0) {
      return null;
    }
    maxes.push({ exercise_id: row.exercise_id, max_weight: weight });
  }
  return maxes;
}

function readState(data: unknown): CurrentMacroState | null {
  return parseCurrentMacroState(data);
}

function readPreview(data: unknown): TransitionPreview | null {
  return parseTransitionPreview(data);
}
