"use client";

import { useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import { deleteJson, patchJson, postJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import type { SessionDetail } from "@/lib/types";
import { readSessionDetail } from "@/lib/workout/session-payload";
import { raiseMaxConfirmMessage } from "@/lib/workout/session-raise";

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
      await patchJson(`/api/sessions/${detail.session.id}`, { note: trimmed });
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
    cancelToday,
  };
}
