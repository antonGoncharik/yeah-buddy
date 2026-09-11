"use client";

import { useEffect, useState } from "react";

import { haptic, holdTimerStepHaptic } from "@/lib/telegram/haptic";

export function SessionHoldTimer({
  seconds,
  disabled,
}: {
  seconds: number | null;
  disabled: boolean;
}) {
  const [left, setLeft] = useState<number | null>(null);
  const total = seconds != null && seconds > 0 ? Math.round(seconds) : 0;

  useEffect(() => {
    if (left == null || left <= 0) {
      return;
    }
    const id = window.setTimeout(() => {
      const next = left - 1;
      const kind = holdTimerStepHaptic(next);
      if (kind) {
        haptic(kind);
      }
      setLeft(next);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [left]);

  if (total <= 0) {
    return null;
  }

  return (
    <button
      type="button"
      className="col-span-2 h-11 rounded-lg bg-background text-base font-medium disabled:opacity-50"
      disabled={disabled}
      onClick={() => {
        haptic("tap");
        setLeft(total);
      }}
    >
      {left == null
        ? `Засечь ${total} с`
        : left === 0
          ? "Ещё раз"
          : `${left} с`}
    </button>
  );
}
