"use client";

import { useEffect, useRef, useState } from "react";

import { haptic, playTimerStepHaptic } from "@/lib/telegram/haptic";
import {
  clearStoredRest,
  nextRestLeft,
  REST_ADJUST_SECONDS,
  readLastRestSeconds,
  readStoredRestState,
  restLeftAt,
  WORK_REST_SECONDS,
  writeStoredRestState,
} from "@/lib/workout/rest-timer";
import { notifyRestTimerDone } from "@/lib/workout/rest-timer-done";
import { acquireScreenWakeLock } from "@/lib/workout/screen-wake-lock";

export function useRestTimer(sessionId: string | null, enabled: boolean) {
  const [left, setLeft] = useState<number | null>(null);
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const [finishedAway, setFinishedAway] = useState(false);
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
    setFinishedAway(false);
    const seconds = id ? readLastRestSeconds(id) : WORK_REST_SECONDS;
    persist(Date.now() + seconds * 1000, id);
    setLeft(seconds);
    setRound((current) => current + 1);
  }

  function bump(delta: number) {
    if (!sessionId || !enabled) {
      return;
    }
    const id = exerciseRef.current;
    setLeft((current) => {
      if (current == null) {
        return current;
      }
      const next = nextRestLeft(current, delta);
      persist(Date.now() + next * 1000, id);
      if (next === 0 && current > 0) {
        notifyRestTimerDone();
        if (document.visibilityState === "hidden") {
          setFinishedAway(true);
        }
      }
      return next;
    });
  }

  function stop() {
    persist(null, exerciseRef.current);
    setLeft(null);
    setFinishedAway(false);
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
      setFinishedAway(false);
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
    const restored = restLeftAt(stored.endsAt, Date.now());
    setLeft(restored);
    if (restored === 0) {
      setFinishedAway(true);
    }
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
        if (next === 0 && prev > 0) {
          notifyRestTimerDone();
          if (document.visibilityState === "hidden") {
            setFinishedAway(true);
          }
        } else {
          playTimerStepHaptic(next);
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

  useEffect(() => {
    if (!running) {
      return;
    }

    let active: { release: () => Promise<void> } | null = null;

    async function hold() {
      active?.release().catch(() => {});
      active = await acquireScreenWakeLock();
    }

    void hold();

    function onVisibility() {
      if (document.visibilityState === "visible") {
        void hold();
      }
    }

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      void active?.release();
      active = null;
    };
  }, [running]);

  return {
    left,
    finishedAway,
    exerciseId,
    round,
    lastSeconds,
    start,
    restart: () => start(exerciseRef.current),
    add: () => bump(REST_ADJUST_SECONDS),
    subtract: () => bump(-REST_ADJUST_SECONDS),
    stop,
  };
}
