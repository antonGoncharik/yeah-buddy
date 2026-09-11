"use client";

import { useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import {
  parseInteger,
  type SetDraft,
} from "@/components/workout/session-drafts";
import { deleteJson, patchJson, postJson, writeJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import type { SessionDetail } from "@/lib/types";
import { parseDecimal } from "@/lib/workout/numbers";
import { readSessionDetail } from "@/lib/workout/session-payload";

export function useSessionActions({
  detail,
  note,
  drafts,
  sessionUrl,
  applyDetail,
  loadFollowUp,
  setBusy,
  setError,
  setCorrecting,
  setDetail,
}: {
  detail: SessionDetail | null;
  note: string;
  drafts: Record<string, SetDraft>;
  sessionUrl: string;
  applyDetail: (next: SessionDetail) => void;
  loadFollowUp: (sessionDate: string) => Promise<void>;
  setBusy: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setCorrecting: Dispatch<SetStateAction<boolean>>;
  setDetail: Dispatch<SetStateAction<SessionDetail | null>>;
}) {
  const router = useRouter();
  const confirm = useConfirm();

  async function complete() {
    if (!detail) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const data = await postJson(
        `/api/sessions/${detail.session.id}/complete`,
        {
          note: note.trim() === "" ? null : note.trim(),
          sets: Object.entries(drafts).map(([id, draft]) => ({
            id,
            actual_weight: parseDecimal(draft.weight),
            actual_reps:
              detail.session.workout_type === "dynamic"
                ? parseInteger(draft.reps)
                : null,
            actual_seconds:
              detail.session.workout_type === "static"
                ? parseDecimal(draft.seconds)
                : null,
          })),
        },
      );

      const next = readSessionDetail(data);
      if (next) {
        writeJson(sessionUrl, data);
        applyDetail(next);
        setCorrecting(false);
        haptic("success");
        await loadFollowUp(next.session.session_date);
      }
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
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

    setBusy(true);
    setError(null);

    try {
      const data = await deleteJson(
        `/api/sessions/${detail.session.id}/exercises/${sessionExerciseId}`,
      );

      const next = readSessionDetail(data);
      if (next) {
        writeJson(sessionUrl, data);
        applyDetail(next);
      }
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
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

    setBusy(true);
    setError(null);

    try {
      await deleteJson(`/api/sessions/${detail.session.id}`);
      haptic("commit");
      router.replace("/workouts");
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  return { complete, saveNote, removeExercise, cancelToday };
}
