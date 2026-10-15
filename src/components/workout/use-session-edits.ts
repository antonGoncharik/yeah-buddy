"use client";

import { useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import { deleteJson, patchJson, postJson, writeJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { queueMutate } from "@/lib/offline-mutate";
import { haptic } from "@/lib/telegram/haptic";
import type { MuscleId, SessionDetail } from "@/lib/types";
import { withSetLogged } from "@/lib/workout/session-complete-local";
import { readSessionDetail } from "@/lib/workout/session-payload";
import { raiseMaxConfirmMessage } from "@/lib/workout/session-raise";
import type { PatchSetInput } from "@/lib/workout/session-schema";
import { readEaseSoreResult } from "@/lib/workout/sore";
import { readShortResult } from "@/lib/workout/session-short";

export function useSessionEdits({
  detail,
  note,
  applyPayload,
  runBusy,
  setError,
  setDetail,
}: {
  detail: SessionDetail | null;
  note: string;
  applyPayload: (data: unknown) => SessionDetail | null;
  runBusy: (work: () => Promise<void>) => Promise<void>;
  setError: Dispatch<SetStateAction<string | null>>;
  setDetail: Dispatch<SetStateAction<SessionDetail | null>>;
}) {
  const router = useRouter();
  const confirm = useConfirm();

  async function raiseMaxes(): Promise<boolean> {
    if (!detail || detail.raise_offers.length === 0) {
      return false;
    }

    const ok = await confirm({
      message: raiseMaxConfirmMessage(detail.raise_offers),
      confirmLabel: "Поднять",
      cancelLabel: "Оставить",
    });
    if (!ok) {
      return false;
    }

    let raised = false;
    await runBusy(async () => {
      const data = await postJson(
        `/api/sessions/${detail.session.id}/raise-maxes`,
        {},
      );
      if (applyPayload(data)) {
        haptic("success");
        raised = true;
      }
    });
    return raised;
  }

  async function saveNote() {
    if (!detail) {
      return;
    }

    const trimmed = note.trim() === "" ? null : note.trim();
    if (trimmed === (detail.session.note ?? null)) {
      return;
    }

    setDetail((current) =>
      current
        ? { ...current, session: { ...current.session, note: trimmed } }
        : current,
    );

    try {
      await queueMutate({
        method: "PATCH",
        url: `/api/sessions/${detail.session.id}`,
        body: { note: trimmed },
        cacheUrls: [
          `/api/sessions/${detail.session.id}`,
          `/api/sessions?date=${encodeURIComponent(detail.session.session_date)}`,
        ],
      });
    } catch (caught) {
      haptic("error");
      setDetail((current) =>
        current
          ? {
              ...current,
              session: { ...current.session, note: detail.session.note },
            }
          : current,
      );
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    }
  }

  async function removeExercise(sessionExerciseId: string) {
    if (!detail) {
      return;
    }

    const ok = await confirm({
      message: "Убрать упражнение из тренировки?",
      confirmLabel: "Убрать",
      cancelLabel: "Оставить",
      destructive: true,
    });
    if (!ok) {
      return;
    }

    const previous = detail;
    setDetail({
      ...previous,
      exercises: previous.exercises.filter(
        (item) => item.id !== sessionExerciseId,
      ),
    });
    haptic("commit");

    try {
      const data = await deleteJson(
        `/api/sessions/${detail.session.id}/exercises/${sessionExerciseId}`,
      );
      applyPayload(data);
    } catch (caught) {
      haptic("error");
      setDetail(previous);
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    }
  }

  async function reorderExercises(exerciseIds: string[]) {
    if (!detail) {
      return;
    }

    const previous = detail;
    const exercises = exerciseIds.flatMap((id) => {
      const row = previous.exercises.find((item) => item.id === id);
      return row ? [row] : [];
    });
    if (exercises.length !== previous.exercises.length) {
      return;
    }

    setDetail({ ...previous, exercises });

    try {
      const data = await patchJson(
        `/api/sessions/${detail.session.id}/exercises`,
        { exerciseIds },
      );
      const next = readSessionDetail(data);
      if (next) {
        setDetail((current) =>
          current ? { ...current, exercises: next.exercises } : next,
        );
      }
    } catch (caught) {
      haptic("error");
      setDetail(previous);
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    }
  }

  async function saveMissingMaxes(
    maxes: Array<{ exercise_id: string; max_weight: number }>,
  ) {
    if (!detail || maxes.length === 0) {
      return;
    }

    await runBusy(async () => {
      const data = await postJson(`/api/sessions/${detail.session.id}/maxes`, {
        maxes,
      });
      if (applyPayload(data)) {
        haptic("commit");
      }
    });
  }

  async function saveMissingTracks(
    tracks: Array<{ exercise_id: string; start_weight: number }>,
  ) {
    if (!detail || tracks.length === 0) {
      return;
    }

    await runBusy(async () => {
      const data = await postJson(`/api/sessions/${detail.session.id}/tracks`, {
        tracks,
      });
      if (applyPayload(data)) {
        haptic("commit");
      }
    });
  }

  async function markSet(
    setId: string,
    patch: PatchSetInput,
  ): Promise<boolean> {
    if (detail?.session.status !== "planned") {
      return false;
    }

    const previous = detail;
    const next = withSetLogged(previous, setId, {
      is_completed: patch.is_completed === true,
      actual_weight: patch.actual_weight,
      actual_reps: patch.actual_reps,
      actual_seconds: patch.actual_seconds,
      actual_rir: patch.actual_rir,
    });
    const url = `/api/sessions/${detail.session.id}`;
    setDetail(next);
    writeJson(url, next);
    haptic("commit");

    try {
      const data = await queueMutate({
        method: "PATCH",
        url: `/api/sets/${setId}`,
        body: patch,
        cacheUrls: [url],
      });
      if (data != null) {
        applyPayload(data);
      }
      return true;
    } catch (caught) {
      haptic("error");
      setDetail(previous);
      writeJson(url, previous);
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
      return false;
    }
  }

  async function swapExercise(
    sessionExerciseId: string,
    exerciseId: string,
  ): Promise<boolean> {
    if (detail?.session.status !== "planned") {
      return false;
    }
    setError(null);
    try {
      const data = await postJson(
        `/api/sessions/${detail.session.id}/exercises/${sessionExerciseId}/swap`,
        { exerciseId },
      );
      if (!applyPayload(data)) {
        throw new Error(LOAD_FAILED);
      }
      haptic("commit");
      return true;
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
      return false;
    }
  }

  async function easeSession(muscles: MuscleId[]): Promise<boolean> {
    if (detail?.session.status !== "planned" || muscles.length === 0) {
      return false;
    }
    setError(null);
    try {
      const data = await postJson(
        `/api/sessions/${detail.session.id}/ease-sore`,
        { muscles },
      );
      const result = readEaseSoreResult(data);
      if (!applyPayload(data)) {
        throw new Error(LOAD_FAILED);
      }
      if (result.eased === 0) {
        setError(
          "В этой тренировке нет упражнений на эту зону — вес не менялся.",
        );
        return false;
      }
      haptic("commit");
      return true;
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
      return false;
    }
  }

  async function shortenSession(): Promise<Array<[string, string]> | null> {
    if (detail?.session.status !== "planned") {
      return null;
    }
    setError(null);
    try {
      const data = await postJson(
        `/api/sessions/${detail.session.id}/shorten`,
        {},
      );
      const result = readShortResult(data);
      if (!applyPayload(data)) {
        throw new Error(LOAD_FAILED);
      }
      if (result.dropped === 0 && result.pairs.length === 0) {
        setError(
          "Уже коротко: рабочих подходов не больше двух, соседние на одну мышцу.",
        );
        return null;
      }
      haptic("commit");
      return result.pairs;
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
      return null;
    }
  }

  async function dropWorkSet(setId: string): Promise<boolean> {
    if (detail?.session.status !== "planned") {
      return false;
    }
    setError(null);
    try {
      const data = await deleteJson(`/api/sets/${setId}`);
      if (!applyPayload(data)) {
        throw new Error(LOAD_FAILED);
      }
      haptic("commit");
      return true;
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
      return false;
    }
  }

  async function addWorkSet(sessionExerciseId: string): Promise<string | null> {
    if (detail?.session.status !== "planned") {
      return null;
    }
    setError(null);
    try {
      const data = await postJson(
        `/api/sessions/${detail.session.id}/exercises/${sessionExerciseId}/sets`,
        {},
      );
      const next = applyPayload(data);
      if (!next) {
        throw new Error(LOAD_FAILED);
      }
      const added = next.exercises
        .find((item) => item.id === sessionExerciseId)
        ?.sets.filter((set) => set.set_type === "work")
        .reduce<(typeof next.exercises)[number]["sets"][number] | null>(
          (best, set) =>
            best == null || set.set_number > best.set_number ? set : best,
          null,
        );
      haptic("commit");
      return added?.id ?? null;
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
      return null;
    }
  }

  async function addExercise(exerciseId: string): Promise<boolean> {
    if (detail?.session.status !== "planned") {
      return false;
    }

    setError(null);
    try {
      const data = await postJson(
        `/api/sessions/${detail.session.id}/exercises`,
        { exerciseId },
      );
      if (!applyPayload(data)) {
        throw new Error(LOAD_FAILED);
      }
      haptic("commit");
      return true;
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
      return false;
    }
  }

  async function cancelToday() {
    if (!detail) {
      return;
    }

    const ok = await confirm({
      message:
        "Убрать эту тренировку? Она останется следующей в программе, ничего не потеряется.",
      confirmLabel: "Убрать",
      cancelLabel: "Оставить",
      destructive: true,
    });
    if (!ok) {
      return;
    }

    await runBusy(async () => {
      await deleteJson(`/api/sessions/${detail.session.id}`);
      haptic("commit");
      router.replace("/workouts");
    });
  }

  return {
    raiseMaxes,
    saveNote,
    removeExercise,
    reorderExercises,
    saveMissingMaxes,
    saveMissingTracks,
    markSet,
    addExercise,
    addWorkSet,
    dropWorkSet,
    swapExercise,
    easeSession,
    shortenSession,
    cancelToday,
  };
}
