"use client";

import { useEffect, useRef, useState } from "react";

import { haptic, holdTimerStepHaptic } from "@/lib/telegram/haptic";
import {
  clearStoredRest,
  nextRestLeft,
  REST_ADJUST_SECONDS,
  readStoredRestEndsAt,
  restLeftAt,
  WORK_REST_SECONDS,
  writeStoredRestEndsAt,
} from "@/lib/workout/rest-timer";

export function useRestTimer(sessionId: string | null, enabled: boolean) {
  const [left, setLeft] = useState<number | null>(null);
  const endsAtRef = useRef<number | null>(null);
  const running = left != null && left > 0;

  function persist(nextEndsAt: number | null) {
    endsAtRef.current = nextEndsAt;
    if (!sessionId || nextEndsAt == null) {
      if (sessionId) {
        clearStoredRest(sessionId);
      }
      return;
    }
    writeStoredRestEndsAt(sessionId, nextEndsAt);
  }

  function start() {
    if (!sessionId || !enabled) {
      return;
    }
    haptic("tap");
    const endsAt = Date.now() + WORK_REST_SECONDS * 1000;
    persist(endsAt);
    setLeft(WORK_REST_SECONDS);
  }

  function bump(delta: number) {
    if (!sessionId || !enabled) {
      return;
    }
    setLeft((current) => {
      if (current == null) {
        return current;
      }
      const next = nextRestLeft(current, delta);
      persist(Date.now() + next * 1000);
      if (next === 0 && current > 0) {
        haptic("success");
      }
      return next;
    });
  }

  function stop() {
    persist(null);
    setLeft(null);
  }

  useEffect(() => {
    if (!sessionId || !enabled) {
      endsAtRef.current = null;
      setLeft(null);
      if (sessionId && !enabled) {
        clearStoredRest(sessionId);
      }
      return;
    }

    const stored = readStoredRestEndsAt(sessionId);
    if (stored == null) {
      return;
    }
    endsAtRef.current = stored;
    setLeft(restLeftAt(stored, Date.now()));
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
          writeStoredRestEndsAt(sessionId, endsAt);
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
    start,
    add: () => bump(REST_ADJUST_SECONDS),
    subtract: () => bump(-REST_ADJUST_SECONDS),
    stop,
  };
}
