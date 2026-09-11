"use client";

import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";

import { cachedGet, mutateJson, postJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import type { CurrentMacroState, TransitionPreview } from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import { parseCurrentMacroState } from "@/lib/workout/hub-payload";
import { parseTransitionPreview } from "@/lib/workout/map-rows";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

export function useMacroScreen() {
  const [state, setState] = useState<CurrentMacroState | null>(null);
  const { loading, begin, done } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<TransitionPreview | null>(null);
  const [transitionDate, setTransitionDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [transitionMaxes, setTransitionMaxes] = useState<
    Record<string, string>
  >({});
  const [transitioning, setTransitioning] = useState(false);
  const [justClosed, setJustClosed] = useState(false);

  const load = useCallback(async () => {
    begin();
    setError(null);

    try {
      await cachedGet(
        "/api/macros",
        (data) => {
          const next = readState(data);
          if (!next) {
            return false;
          }
          setState(next);
          setDrafts(
            Object.fromEntries(
              (next.maxes ?? []).map((row) => [
                row.exercise.id,
                row.phase_max ? formatWeight(row.phase_max.max_weight) : "",
              ]),
            ),
          );
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
  }, [begin, done]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveMax(exerciseId: string) {
    if (!state?.phase) {
      return;
    }

    const weight = parseDecimal(drafts[exerciseId] ?? "");
    if (weight == null || weight <= 0) {
      haptic("warn");
      setError("Проверь рабочий вес.");
      return;
    }

    setSavingId(exerciseId);
    setError(null);

    try {
      await postJson(`/api/phases/${state.phase.id}/maxes`, {
        exercise_id: exerciseId,
        max_weight: weight,
      });
      await load();
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setSavingId(null);
    }
  }

  async function openTransition() {
    setError(null);
    setTransitioning(true);

    try {
      const data = await mutateJson("/api/macros/transition");
      const next = readPreview(data);
      if (!next) {
        haptic("error");
        setError(LOAD_FAILED);
        return;
      }

      setPreview(next);
      setTransitionDate(format(new Date(), "yyyy-MM-dd"));
      setTransitionMaxes(
        Object.fromEntries(
          next.maxes.map((row) => [
            row.exercise_id,
            formatWeight(row.proposed_weight),
          ]),
        ),
      );
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setTransitioning(false);
    }
  }

  async function confirmTransition() {
    const maxes = (preview?.maxes ?? []).flatMap((row) => {
      const weight = parseDecimal(transitionMaxes[row.exercise_id] ?? "");
      if (weight == null || weight <= 0) {
        return [];
      }
      return [{ exercise_id: row.exercise_id, max_weight: weight }];
    });

    if (!preview || maxes.length !== preview.maxes.length) {
      haptic("warn");
      setError("Проверь предложенные рабочие веса.");
      return;
    }

    const closingMacro = preview.new_macro;
    setTransitioning(true);
    setError(null);

    try {
      await postJson("/api/macros/transition", {
        end_date: transitionDate,
        maxes,
      });
      setPreview(null);
      setJustClosed(closingMacro);
      haptic("success");
      await load();
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setTransitioning(false);
    }
  }

  return {
    state,
    loading,
    error,
    drafts,
    setDrafts,
    savingId,
    preview,
    setPreview,
    transitionDate,
    setTransitionDate,
    transitionMaxes,
    setTransitionMaxes,
    transitioning,
    justClosed,
    load,
    saveMax,
    openTransition,
    confirmTransition,
  };
}

function readState(data: unknown): CurrentMacroState | null {
  return parseCurrentMacroState(data);
}

function readPreview(data: unknown): TransitionPreview | null {
  return parseTransitionPreview(data);
}
