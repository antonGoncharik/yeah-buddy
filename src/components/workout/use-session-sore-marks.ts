"use client";

import { useEffect, useState } from "react";

import { calendarToday } from "@/lib/day/dates";
import { haptic } from "@/lib/telegram/haptic";
import type { MuscleId } from "@/lib/types";
import {
  activeSoreMarks,
  type SoreMark,
  type SoreSpotId,
  soreMuscles,
  soreUntil,
} from "@/lib/workout/sore";
import {
  readStoredSoreMarks,
  writeStoredSoreMarks,
} from "@/lib/workout/sore-marks";

export function useSessionSoreMarks(sessionId: string) {
  const [marks, setMarks] = useState<SoreMark[]>([]);
  const [busy, setBusy] = useState(false);
  const today = calendarToday();
  const active = activeSoreMarks(marks, today);
  const eased = active.some((mark) => mark.easedSessionIds.includes(sessionId));

  useEffect(() => {
    setMarks(readStoredSoreMarks());
  }, []);

  function persist(next: SoreMark[]) {
    setMarks(next);
    writeStoredSoreMarks(next);
  }

  function toggle(id: SoreSpotId) {
    haptic("tick");
    const current = activeSoreMarks(marks, today);
    if (current.some((mark) => mark.id === id)) {
      persist(marks.filter((mark) => mark.id !== id || mark.until < today));
      return;
    }
    persist([
      ...marks.filter((mark) => mark.id !== id),
      { id, until: soreUntil(today), easedSessionIds: [] },
    ]);
  }

  async function easeWorkout(
    onEase: (muscles: MuscleId[]) => Promise<boolean>,
  ) {
    const muscles = soreMuscles(active);
    if (muscles.length === 0 || busy) {
      return;
    }
    setBusy(true);
    try {
      const ok = await onEase(muscles);
      if (!ok) {
        return;
      }
      setMarks((current) => {
        const next = current.map((mark) =>
          mark.until >= today && !mark.easedSessionIds.includes(sessionId)
            ? {
                ...mark,
                easedSessionIds: [...mark.easedSessionIds, sessionId],
              }
            : mark,
        );
        writeStoredSoreMarks(next);
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  return { active, eased, busy, toggle, easeWorkout };
}
