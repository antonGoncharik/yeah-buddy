"use client";

import { useConfirm } from "@/components/layout/confirm-provider";
import {
  reportSessionEditError,
  type SessionEditBridge,
} from "@/components/workout/session-edit-bridge";
import { deleteJson, patchJson, postJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import { readSessionDetail } from "@/lib/workout/session-payload";
import {
  sessionDetailUrl,
  sessionExerciseUrl,
} from "@/lib/workout/session-urls";

export function useSessionExerciseEdits({
  detail,
  applyPayload,
  setError,
  setDetail,
}: Pick<
  SessionEditBridge,
  "detail" | "applyPayload" | "setError" | "setDetail"
>) {
  const confirm = useConfirm();

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
        sessionExerciseUrl(detail.session.id, sessionExerciseId),
      );
      applyPayload(data);
    } catch (caught) {
      haptic("error");
      setDetail(previous);
      reportSessionEditError(setError, caught);
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
        `${sessionDetailUrl(detail.session.id)}/exercises`,
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
      reportSessionEditError(setError, caught);
    }
  }

  async function addExercise(exerciseId: string): Promise<boolean> {
    if (detail?.session.status !== "planned") {
      return false;
    }

    setError(null);
    try {
      const data = await postJson(
        `${sessionDetailUrl(detail.session.id)}/exercises`,
        { exerciseId },
      );
      if (!applyPayload(data)) {
        throw new Error(LOAD_FAILED);
      }
      haptic("commit");
      return true;
    } catch (caught) {
      reportSessionEditError(setError, caught);
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
        `${sessionExerciseUrl(detail.session.id, sessionExerciseId)}/swap`,
        { exerciseId },
      );
      if (!applyPayload(data)) {
        throw new Error(LOAD_FAILED);
      }
      haptic("commit");
      return true;
    } catch (caught) {
      reportSessionEditError(setError, caught);
      return false;
    }
  }

  return {
    removeExercise,
    reorderExercises,
    addExercise,
    swapExercise,
  };
}
