"use client";

import { useEffect, useState } from "react";

import type { SessionDetail } from "@/lib/types";
import {
  pruneSessionPairs,
  readSessionPairs,
  writeSessionPairs,
} from "@/lib/workout/session-pairs";

export function useSessionExercisePairs(
  sessionId: string | undefined,
  exercises: SessionDetail["exercises"] | undefined,
) {
  const [pairs, setPairs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!sessionId) {
      return;
    }
    setPairs(readSessionPairs(sessionId));
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !exercises?.length) {
      return;
    }
    const ids = new Set(exercises.map((item) => item.id));
    setPairs((current) => {
      const pruned = pruneSessionPairs(current, ids);
      if (JSON.stringify(pruned) === JSON.stringify(current)) {
        return current;
      }
      writeSessionPairs(sessionId, pruned);
      return pruned;
    });
  }, [sessionId, exercises]);

  return { pairs, setPairs };
}
