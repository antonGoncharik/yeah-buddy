"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { calendarToday } from "@/lib/day/dates";
import { formatIsoDate } from "@/lib/day/format";
import { haptic } from "@/lib/telegram/haptic";
import type { MuscleId } from "@/lib/types";
import {
  activeSoreMarks,
  SORE_SPOTS,
  type SoreMark,
  type SoreSpotId,
  soreMuscles,
  soreUntil,
} from "@/lib/workout/sore";
import {
  readStoredSoreMarks,
  writeStoredSoreMarks,
} from "@/lib/workout/sore-marks";

export function SessionSoreBanner({
  sessionId,
  disabled,
  onEase,
}: {
  sessionId: string;
  disabled: boolean;
  onEase: (muscles: MuscleId[]) => Promise<boolean>;
}) {
  const [marks, setMarks] = useState<SoreMark[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const today = calendarToday();
  const active = activeSoreMarks(marks, today);
  const eased = active.some((mark) => mark.easedSessionIds.includes(sessionId));

  useEffect(() => {
    setMarks(readStoredSoreMarks());
  }, []);

  function save(next: SoreMark[]) {
    setMarks(next);
    writeStoredSoreMarks(next);
  }

  function toggle(id: SoreSpotId) {
    haptic("tick");
    const current = activeSoreMarks(marks, today);
    if (current.some((mark) => mark.id === id)) {
      save(marks.filter((mark) => mark.id !== id || mark.until < today));
      return;
    }
    save([
      ...marks.filter((mark) => mark.id !== id),
      { id, until: soreUntil(today), easedSessionIds: [] },
    ]);
  }

  async function ease() {
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

  return (
    <section className="flex flex-col gap-2">
      <button
        type="button"
        className="min-h-11 self-start text-base font-medium text-muted-foreground"
        onClick={() => setOpen((current) => !current)}
      >
        {active.length > 0
          ? `${active.map((mark) => spotLabel(mark.id)).join(", ")} побаливает до ${formatIsoDate(active[0].until, "d MMM")}`
          : "Что-то болит"}
      </button>
      {open ? (
        <div className="flex flex-wrap gap-2">
          {SORE_SPOTS.map((spot) => {
            const on = active.some((mark) => mark.id === spot.id);
            return (
              <Button
                key={spot.id}
                type="button"
                variant={on ? "secondary" : "outline"}
                className="min-h-11"
                onClick={() => toggle(spot.id)}
              >
                {spot.label}
              </Button>
            );
          })}
        </div>
      ) : null}
      {active.length > 0 && !eased ? (
        <Button
          type="button"
          variant="outline"
          className="min-h-11 self-start"
          disabled={disabled || busy}
          onClick={() => void ease()}
        >
          Облегчить эту тренировку на 15%
        </Button>
      ) : null}
    </section>
  );
}

function spotLabel(id: SoreSpotId): string {
  return SORE_SPOTS.find((spot) => spot.id === id)?.label ?? id;
}
