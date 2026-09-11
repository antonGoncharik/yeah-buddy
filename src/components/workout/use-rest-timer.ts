"use client";

import { useEffect, useRef, useState } from "react";

import { haptic, holdTimerStepHaptic } from "@/lib/telegram/haptic";
import {
  clearStoredRest,
  nextRestLeft,
  nextRestPreset,
  REST_ADJUST_SECONDS,
  readLastRestSeconds,
  readStoredRestState,
  restLeftAt,
  WORK_REST_SECONDS,
  writeLastRestSeconds,
  writeStoredRestState,
} from "@/lib/workout/rest-timer";

export function useRestTimer(sessionId: string | null, enabled: boolean) {
  const [left, setLeft] = useState<number | null>(null);
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const endsAtRef = useRef<number | null>(null);
  const exerciseRef = useRef<string | null>(null);
  const running = left != null && left > 0;

  function persist(nextEndsAt: number | null, nextExerciseId: string | null) {
    endsAtRef.current = nextEndsAt;
    exerciseRef.current = nextExerciseId;
    setExerciseId(nextExerciseId);
    if (!sessionId || nextEndsAt == null) {
      if (sessionId) {
        clearStoredRest(sessionId);
      }
      return;
    }
    writeStoredRestState(sessionId, {
      endsAt: nextEndsAt,
      exerciseId: nextExerciseId,
    });
  }

  function start(nextExerciseId?: string | null) {
    if (!sessionId || !enabled) {
      return;
    }
    const id = nextExerciseId || exerciseRef.current;
    haptic("tap");
    const seconds = id ? readLastRestSeconds(id) : WORK_REST_SECONDS;
    persist(Date.now() + seconds * 1000, id);
    setLeft(seconds);
  }

  function bump(delta: number) {
    if (!sessionId || !enabled) {
      return;
    }
    const id = exerciseRef.current;
    if (id) {
      writeLastRestSeconds(id, nextRestPreset(readLastRestSeconds(id), delta));
    }
    setLeft((current) => {
      if (current == null) {
        return current;
      }
      const next = nextRestLeft(current, delta);
      persist(Date.now() + next * 1000, id);
      if (next === 0 && current > 0) {
        haptic("success");
      }
      return next;
    });
  }

  function stop() {
    persist(null, exerciseRef.current);
    setLeft(null);
  }

  function lastSeconds(id: string): number {
    return readLastRestSeconds(id);
  }

  useEffect(() => {
    if (!sessionId || !enabled) {
      endsAtRef.current = null;
      exerciseRef.current = null;
      setExerciseId(null);
      setLeft(null);
      if (sessionId && !enabled) {
        clearStoredRest(sessionId);
      }
      return;
    }

    const stored = readStoredRestState(sessionId);
    if (stored == null) {
      return;
    }
    endsAtRef.current = stored.endsAt;
    exerciseRef.current = stored.exerciseId;
    setExerciseId(stored.exerciseId);
    setLeft(restLeftAt(stored.endsAt, Date.now()));
  }, [enabled, sessionId]);

  useEffect(() => {
    if (!running || !sessionId) {
      return;
    }

    function sync() {
      setLeft((prev) => {
        const endsAt = endsAtRef.current;
        if (prev == null || endsAt == null) {
          return prev;
        }
        const next = restLeftAt(endsAt, Date.now());
        if (next === prev) {
          return prev;
        }
        const kind = holdTimerStepHaptic(next);
        if (kind) {
          haptic(kind);
        }
        if (next === 0 && sessionId) {
          writeStoredRestState(sessionId, {
            endsAt,
            exerciseId: exerciseRef.current,
          });
        }
        return next;
      });
    }

    const id = window.setInterval(sync, 250);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pageshow", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pageshow", sync);
      window.removeEventListener("focus", sync);
    };
  }, [running, sessionId]);

  return {
    left,
    exerciseId,
    lastSeconds,
    start,
    restart: () => start(exerciseRef.current),
    add: () => bump(REST_ADJUST_SECONDS),
    subtract: () => bump(-REST_ADJUST_SECONDS),
    stop,
  };
}
