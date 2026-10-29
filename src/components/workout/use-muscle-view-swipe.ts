"use client";

import { useCallback, useRef } from "react";

import type { MuscleBodyView } from "@/lib/types";

export function useMuscleViewSwipe(onSwipe: (view: MuscleBodyView) => void) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start) {
        return;
      }
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (Math.abs(dx) < 72 || Math.abs(dx) < Math.abs(dy) * 1.2) {
        return;
      }
      onSwipe(dx > 0 ? "front" : "back");
    },
    [onSwipe],
  );

  return { onTouchStart, onTouchEnd };
}
