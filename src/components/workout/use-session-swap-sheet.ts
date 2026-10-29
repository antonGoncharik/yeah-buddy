"use client";

import { useEffect, useState } from "react";

import { cachedGet } from "@/lib/api-cache";
import { LOAD_FAILED } from "@/lib/messages";
import type { MuscleId } from "@/lib/types";
import type { SessionSwapOption } from "@/lib/workout/session-swap-options";
import { readSessionSwapOptions } from "@/lib/workout/session-swap-options";

export function useSessionSwapSheet({
  open,
  sessionId,
  sessionExerciseId,
  fromExerciseId,
  templateId,
  onSwap,
  onOfferTemplate,
  onClose,
}: {
  open: boolean;
  sessionId: string;
  sessionExerciseId: string;
  fromExerciseId: string;
  templateId: string | null;
  onSwap: (sessionExerciseId: string, exerciseId: string) => Promise<boolean>;
  onOfferTemplate?: (offer: {
    fromExerciseId: string;
    exerciseId: string;
    name: string;
  }) => void;
  onClose: () => void;
}) {
  const [muscle, setMuscle] = useState<string | null>(null);
  const [muscleId, setMuscleId] = useState<MuscleId | null>(null);
  const [options, setOptions] = useState<SessionSwapOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void cachedGet(
      `/api/sessions/${sessionId}/exercises/${sessionExerciseId}/swap`,
      (data) => {
        if (!cancelled) {
          const parsed = readSessionSwapOptions(data);
          setMuscle(parsed.muscle);
          setMuscleId(parsed.muscleId);
          setOptions(parsed.options);
        }
        return true;
      },
    )
      .catch(() => {
        if (!cancelled) {
          setError(LOAD_FAILED);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, sessionExerciseId, sessionId]);

  async function pick(exerciseId: string, name: string) {
    if (pendingId) {
      return;
    }
    const from = fromExerciseId;
    setPendingId(exerciseId);
    const ok = await onSwap(sessionExerciseId, exerciseId);
    setPendingId(null);
    if (ok && templateId) {
      onOfferTemplate?.({ fromExerciseId: from, exerciseId, name });
    }
    if (ok) {
      onClose();
    }
  }

  return {
    muscle,
    muscleId,
    options,
    loading,
    error,
    pendingId,
    pick,
  };
}
