"use client";

import { useEffect, useRef, useState } from "react";

import { haptic, holdTimerStepHaptic } from "@/lib/telegram/haptic";
import {
  nextRestLeft,
  REST_ADJUST_SECONDS,
  WORK_REST_SECONDS,
} from "@/lib/workout/rest-timer";

export function useRestTimer() {
  const [left, setLeft] = useState<number | null>(null);
  const endsAtRef = useRef<number | null>(null);
  const running = left != null && left > 0;

  function start() {
    haptic("tap");
    endsAtRef.current = Date.now() + WORK_REST_SECONDS * 1000;
    setLeft(WORK_REST_SECONDS);
  }

  function bump(delta: number) {
    setLeft((current) => {
      if (current == null) {
        return current;
      }
      const next = nextRestLeft(current, delta);
      endsAtRef.current = Date.now() + next * 1000;
      if (next === 0 && current > 0) {
        haptic("success");
      }
      return next;
    });
  }

  function stop() {
    endsAtRef.current = null;
    setLeft(null);
  }

  useEffect(() => {
    if (!running) {
      return;
    }

    function sync() {
      setLeft((prev) => {
        const endsAt = endsAtRef.current;
        if (prev == null || endsAt == null) {
          return prev;
        }
        const next = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
        if (next === prev) {
          return prev;
        }
        const kind = holdTimerStepHaptic(next);
        if (kind) {
          haptic(kind);
        }
        return next;
      });
    }

    const id = window.setInterval(sync, 250);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [running]);

  return {
    left,
    start,
    add: () => bump(REST_ADJUST_SECONDS),
    subtract: () => bump(-REST_ADJUST_SECONDS),
    stop,
  };
}
