"use client";

import { useRouter } from "next/navigation";

import { useConfirm } from "@/components/layout/confirm-provider";
import {
  reportSessionEditError,
  type SessionEditBridge,
} from "@/components/workout/session-edit-bridge";
import { deleteJson, postJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { queueMutate } from "@/lib/offline-mutate";
import { haptic } from "@/lib/telegram/haptic";
import type { MuscleId } from "@/lib/types";
import { raiseMaxConfirmMessage } from "@/lib/workout/session-raise";
import { readShortResult } from "@/lib/workout/session-short";
import {
  sessionDetailCacheUrls,
  sessionDetailUrl,
} from "@/lib/workout/session-urls";
import { readEaseSoreResult } from "@/lib/workout/sore";

export function useSessionFlowEdits({
  detail,
  note,
  applyPayload,
  runBusy,
  setError,
  setDetail,
}: SessionEditBridge) {
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
        `${sessionDetailUrl(detail.session.id)}/raise-maxes`,
        {},
      );
      if (applyPayload(data)) {
        haptic("success");
        raised = true;
      }
    });
    return raised;
  }

  async function saveMissingMaxes(
    maxes: Array<{ exercise_id: string; max_weight: number }>,
  ) {
    if (!detail || maxes.length === 0) {
      return;
    }

    await runBusy(async () => {
      const data = await postJson(
        `${sessionDetailUrl(detail.session.id)}/maxes`,
        { maxes },
      );
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
      const data = await postJson(
        `${sessionDetailUrl(detail.session.id)}/tracks`,
        { tracks },
      );
      if (applyPayload(data)) {
        haptic("commit");
      }
    });
  }

  async function easeSession(muscles: MuscleId[]): Promise<boolean> {
    if (detail?.session.status !== "planned" || muscles.length === 0) {
      return false;
    }
    setError(null);
    try {
      const data = await postJson(
        `${sessionDetailUrl(detail.session.id)}/ease-sore`,
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
      reportSessionEditError(setError, caught);
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
        `${sessionDetailUrl(detail.session.id)}/shorten`,
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
      reportSessionEditError(setError, caught);
      return null;
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

    setDetail((current) =>
      current
        ? { ...current, session: { ...current.session, note: trimmed } }
        : current,
    );

    try {
      await queueMutate({
        method: "PATCH",
        url: sessionDetailUrl(detail.session.id),
        body: { note: trimmed },
        cacheUrls: sessionDetailCacheUrls(detail),
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
      reportSessionEditError(setError, caught);
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
      await deleteJson(sessionDetailUrl(detail.session.id));
      haptic("commit");
      router.replace("/workouts");
    });
  }

  return {
    raiseMaxes,
    saveMissingMaxes,
    saveMissingTracks,
    easeSession,
    shortenSession,
    saveNote,
    cancelToday,
  };
}
