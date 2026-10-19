"use client";

import { useEffect, useRef, useState } from "react";

import { haptic, playTimerStepHaptic } from "@/lib/telegram/haptic";

export function SessionHoldTimer({
  seconds,
  disabled,
}: {
  seconds: number | null;
  disabled: boolean;
}) {
  const total = seconds != null && seconds > 0 ? Math.round(seconds) : 0;
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const sounded = useRef<number | null>(null);

  useEffect(() => {
    if (endsAt == null) {
      return;
    }

    function sync() {
      const next = Math.max(0, Math.ceil(((endsAt ?? 0) - Date.now()) / 1000));
      setLeft((prev) => (prev === next ? prev : next));
      if (sounded.current !== next) {
        sounded.current = next;
        playTimerStepHaptic(next);
      }
      return next;
    }

    const id = window.setInterval(() => {
      if (sync() === 0) {
        window.clearInterval(id);
      }
    }, 200);
    document.addEventListener("visibilitychange", sync);
    if (sync() === 0) {
      window.clearInterval(id);
    }

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [endsAt]);

  if (total <= 0) {
    return null;
  }

  const running = left != null && left > 0;

  return (
    <button
      type="button"
      className="h-11 w-full rounded-lg bg-background text-base font-medium tabular-nums disabled:opacity-50"
      disabled={disabled}
      onClick={() => {
        if (running) {
          return;
        }
        haptic("tap");
        sounded.current = total;
        setLeft(total);
        setEndsAt(Date.now() + total * 1000);
      }}
    >
      {running ? `${left} с` : left === 0 ? "Ещё раз" : `Засечь ${total} с`}
    </button>
  );
}
