"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/api-cache";
import { calendarToday } from "@/lib/day/dates";
import { formatIsoDate } from "@/lib/day/format";
import { haptic } from "@/lib/telegram/haptic";
import {
  activeSoreMarks,
  SORE_SPOTS,
  type SoreMark,
  type SoreSpotId,
  soreMuscles,
  soreUntil,
} from "@/lib/workout/sore";

const STORAGE_KEY = "yeah-buddy-sore";

export function SessionSoreBanner({
  sessionId,
  disabled,
  onEased,
}: {
  sessionId: string;
  disabled: boolean;
  onEased: () => void;
}) {
  const [marks, setMarks] = useState<SoreMark[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const today = calendarToday();
  const active = activeSoreMarks(marks, today);
  const eased = active.some((mark) => mark.easedSessionIds.includes(sessionId));

  useEffect(() => {
    setMarks(readMarks());
  }, []);

  function save(next: SoreMark[]) {
    setMarks(next);
    writeMarks(next);
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
      await postJson(`/api/sessions/${sessionId}/ease-sore`, { muscles });
      save(
        marks.map((mark) =>
          mark.until >= today && !mark.easedSessionIds.includes(sessionId)
            ? { ...mark, easedSessionIds: [...mark.easedSessionIds, sessionId] }
            : mark,
        ),
      );
      haptic("commit");
      onEased();
    } catch {
      haptic("error");
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

function readMarks(): SoreMark[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.flatMap((item) => {
      if (typeof item !== "object" || item == null) {
        return [];
      }
      if (!("id" in item) || !("until" in item)) {
        return [];
      }
      const spot = SORE_SPOTS.find((row) => row.id === item.id);
      if (!spot || typeof item.until !== "string") {
        return [];
      }
      const eased =
        "easedSessionIds" in item && Array.isArray(item.easedSessionIds)
          ? item.easedSessionIds.filter(
              (id: unknown): id is string => typeof id === "string",
            )
          : [];
      return [{ id: spot.id, until: item.until, easedSessionIds: eased }];
    });
  } catch {
    return [];
  }
}

function writeMarks(marks: SoreMark[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(marks));
}
