"use client";

import { useCallback, useState } from "react";

import { useConfirm } from "@/components/layout/confirm-provider";
import { deleteJson, putJson } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import type { ExerciseTrack } from "@/lib/types";
import {
  EXERCISE_TRACK_REMOVE_CONFIRM,
  readExerciseTrackFromApi,
} from "@/lib/workout/exercise-track-payload";
import { parseDecimal } from "@/lib/workout/numbers";
import { trackCurrentWeight } from "@/lib/workout/track-line";

export function useExerciseTrackMutations({
  exerciseId,
  initialTrack,
}: {
  exerciseId: string;
  initialTrack: ExerciseTrack | null;
}) {
  const confirm = useConfirm();
  const [track, setTrack] = useState<ExerciseTrack | null>(initialTrack);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveWeight = useCallback(
    async (parsed: number | null, revertDraft: () => void) => {
      const current = track ? trackCurrentWeight(track) : null;
      if (parsed == null || parsed <= 0) {
        return false;
      }
      if (current != null && parsed === current) {
        return true;
      }
      setBusy(true);
      setError(null);
      try {
        const data = await putJson(`/api/exercises/${exerciseId}/track`, {
          weight: parsed,
        });
        setTrack(readExerciseTrackFromApi(data));
        haptic("commit");
        return true;
      } catch (caught) {
        haptic("error");
        setError(caught instanceof Error ? caught.message : LOAD_FAILED);
        revertDraft();
        return false;
      } finally {
        setBusy(false);
      }
    },
    [exerciseId, track],
  );

  const removeTrack = useCallback(async () => {
    const ok = await confirm({
      message: EXERCISE_TRACK_REMOVE_CONFIRM,
      confirmLabel: "Убрать",
      cancelLabel: "Оставить",
      destructive: true,
    });
    if (!ok) {
      return false;
    }
    setBusy(true);
    setError(null);
    try {
      await deleteJson(`/api/exercises/${exerciseId}/track`);
      setTrack(null);
      haptic("commit");
      return true;
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
      return false;
    } finally {
      setBusy(false);
    }
  }, [confirm, exerciseId]);

  return {
    track,
    setTrack,
    busy,
    error,
    setError,
    saveWeight,
    removeTrack,
    parseWeight: parseDecimal,
  };
}
