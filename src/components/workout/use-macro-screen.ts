"use client";

import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";

import { cachedGet, mutateJson, postJson, writeJson } from "@/lib/api-cache";
import { calendarToday } from "@/lib/day/dates";
import { LOAD_FAILED } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import type { CurrentMacroState, TransitionPreview } from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import { parseCurrentMacroState } from "@/lib/workout/hub-payload";
import { syncGymCachesAfterWorkoutChange } from "@/lib/workout/gym-cache-sync";
import { forwardDraft, maxFollowsWeek } from "@/lib/workout/macro-forward";
import { parseTransitionPreview } from "@/lib/workout/map-rows";
import { formatWeight, parseDecimal } from "@/lib/workout/numbers";

export function useMacroScreen() {
  const [state, setState] = useState<CurrentMacroState | null>(null);
  const { loading, begin, done } = useFirstLoad();
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<TransitionPreview | null>(null);
  const [transitionDate, setTransitionDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [pendingTitle, setPendingTitle] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [justClosed, setJustClosed] = useState(false);

  const applyState = useCallback((next: CurrentMacroState) => {
    setState(next);
    setDrafts(draftsFromState(next));
    setOverrides({});
    setPendingTitle(null);
  }, []);

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
          applyState(next);
          return true;
        },
        () => done(true),
      );
      done(true);

      void mutateJson("/api/macros")
        .then((data) => {
          writeJson("/api/macros", data);
          const next = readState(data);
          if (next) {
            applyState(next);
          }
        })
        .catch(() => undefined);
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
    void mutateJson("/api/macros/transition")
      .then((data) => {
        if (cancel) {
          return;
        }
        setPreview(readPreview(data));
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
    setOverrides((current) => {
      if (current[exerciseId] == null) {
        return current;
      }
      const next = { ...current };
      delete next[exerciseId];
      return next;
    });
  }

  function changeForward(exerciseId: string, value: string) {
    setOverrides((current) => ({ ...current, [exerciseId]: value }));
  }

  const forward = forwardMap(state, drafts, overrides, preview);

  async function completeWeek() {
    if (!state?.phase || advancing) {
      return;
    }

    setAdvancing(true);
    setError(null);
    let ready = preview;
    if (!ready) {
      try {
        ready = readPreview(await mutateJson("/api/macros/transition"));
        setPreview(ready);
      } catch (caught) {
        setAdvancing(false);
        haptic("error");
        setError(caught instanceof Error ? caught.message : LOAD_FAILED);
        return;
      }
    }

    const sent = collectForward(
      drafts,
      forwardMap(state, drafts, overrides, ready),
      ready,
    );
    if (!sent || !ready) {
      setAdvancing(false);
      haptic("warn");
      setError("Проверь максимум на раз.");
      return;
    }

    const previous = {
      drafts,
      overrides,
      pendingTitle,
    };
    const title = ready.to_name ?? (ready.new_macro ? "Новый цикл" : "Дальше");
    setPendingTitle(title);
    setDrafts(sent.asCurrent);
    setOverrides({});
    haptic("success");

    try {
      await saveDirtyMaxes(state, previous.drafts);
      const closingMacro = ready.new_macro;
      await postJson("/api/macros/transition", {
        end_date: transitionDate,
        maxes: sent.maxes,
      });
      setJustClosed(closingMacro);
      await syncGymCachesAfterWorkoutChange(calendarToday());
      const data = await mutateJson("/api/macros");
      const next = readState(data);
      if (!next) {
        throw new Error(LOAD_FAILED);
      }
      applyState(next);
      setPreview(null);
    } catch (caught) {
      haptic("error");
      setDrafts(previous.drafts);
      setOverrides(previous.overrides);
      setPendingTitle(previous.pendingTitle);
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setAdvancing(false);
    }
  }

  return {
    state,
    loading,
    error,
    drafts,
    forward,
    transitionDate,
    setTransitionDate,
    pendingTitle,
    advancing,
    justClosed,
    load,
    changeDraft,
    changeForward,
    completeWeek,
  };
}

function draftsFromState(state: CurrentMacroState): Record<string, string> {
  return Object.fromEntries(
    state.maxes.map((row) => [
      row.exercise.id,
      row.phase_max ? formatWeight(row.phase_max.max_weight) : "",
    ]),
  );
}

function forwardMap(
  state: CurrentMacroState | null,
  drafts: Record<string, string>,
  overrides: Record<string, string>,
  preview: TransitionPreview | null,
): Record<string, string | null> {
  if (!state || !preview) {
    return {};
  }

  const rows = new Map(
    preview.maxes.map((row) => [row.exercise_id, row] as const),
  );
  return Object.fromEntries(
    state.maxes.map((row) => {
      const planned = rows.get(row.exercise.id);
      const saved = row.phase_max?.max_weight ?? null;
      const pinned =
        planned && !maxFollowsWeek(planned.current_weight, saved)
          ? planned.proposed_weight
          : null;
      return [
        row.exercise.id,
        forwardDraft({
          weekDraft: drafts[row.exercise.id] ?? "",
          step: row.exercise.weight_step,
          increased: preview.increased && !preview.hold_weights,
          increasePercent: preview.increase_percent,
          pinned,
          override: overrides[row.exercise.id],
        }),
      ];
    }),
  );
}

function collectForward(
  drafts: Record<string, string>,
  forward: Record<string, string | null>,
  preview: TransitionPreview | null,
): {
  maxes: Array<{ exercise_id: string; max_weight: number }>;
  asCurrent: Record<string, string>;
} | null {
  if (!preview) {
    return null;
  }

  const asCurrent = { ...drafts };
  const maxes = [];
  for (const row of preview.maxes) {
    const raw = forward[row.exercise_id] ?? drafts[row.exercise_id] ?? "";
    const weight = parseDecimal(raw);
    if (weight == null || weight <= 0) {
      return null;
    }
    maxes.push({ exercise_id: row.exercise_id, max_weight: weight });
    asCurrent[row.exercise_id] = formatWeight(weight);
  }
  return { maxes, asCurrent };
}

async function saveDirtyMaxes(
  state: CurrentMacroState,
  drafts: Record<string, string>,
): Promise<void> {
  if (!state.phase) {
    return;
  }

  const phaseId = state.phase.id;
  await Promise.all(
    state.maxes.map(async (row) => {
      const weight = parseDecimal(drafts[row.exercise.id] ?? "");
      const saved = row.phase_max?.max_weight ?? null;
      if (weight == null || weight <= 0) {
        return;
      }
      if (saved != null && Math.abs(saved - weight) < 0.001) {
        return;
      }
      await postJson(`/api/phases/${phaseId}/maxes`, {
        exercise_id: row.exercise.id,
        max_weight: weight,
      });
    }),
  );
}

function readState(data: unknown): CurrentMacroState | null {
  return parseCurrentMacroState(data);
}

function readPreview(data: unknown): TransitionPreview | null {
  return parseTransitionPreview(data);
}
