"use client";

import { useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import { deleteJson, patchJson, postJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import type { SessionDetail } from "@/lib/types";
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

  async function raiseMaxes() {
    if (!detail || detail.raise_offers.length === 0) {
      return;
    }

    const ok = await confirm({
      message: raiseMaxConfirmMessage(detail.raise_offers),
      confirmLabel: "Поднять",
      cancelLabel: "Оставить",
    });
    if (!ok) {
      return;
    }

    await runBusy(async () => {
      const data = await postJson(
        `/api/sessions/${detail.session.id}/raise-maxes`,
        {},
      );
      if (applyPayload(data)) {
        haptic("success");
      }
    });
  }

  async function saveNote() {
    if (!detail) {
      return;
    }

    const trimmed = note.trim() === "" ? null : note.trim();
    if (trimmed === (detail.session.note ?? null)) {
      return;
    }

    try {
      await patchJson(`/api/sessions/${detail.session.id}`, { note: trimmed });
      setDetail((current) =>
        current
          ? { ...current, session: { ...current.session, note: trimmed } }
          : current,
      );
    } catch (caught) {
      haptic("error");
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

    await runBusy(async () => {
      const data = await deleteJson(
        `/api/sessions/${detail.session.id}/exercises/${sessionExerciseId}`,
      );
      applyPayload(data);
    });
  }

  async function cancelToday() {
    if (!detail) {
      return;
    }

    const ok = await confirm({
      message: "Убрать эту тренировку? Остальные на месте.",
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

  return { raiseMaxes, saveNote, removeExercise, cancelToday };
}
