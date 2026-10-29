"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { SessionSoreSpotPicker } from "@/components/workout/session-sore-spot-picker";
import { useSessionSoreMarks } from "@/components/workout/use-session-sore-marks";
import { formatIsoDate } from "@/lib/day/format";
import type { MuscleId } from "@/lib/types";
import { soreSpotLabel } from "@/lib/workout/sore-spot-label";

export function SessionSoreBanner({
  sessionId,
  disabled,
  onEase,
}: {
  sessionId: string;
  disabled: boolean;
  onEase: (muscles: MuscleId[]) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const sore = useSessionSoreMarks(sessionId);

  return (
    <section className="flex flex-col gap-2">
      <button
        type="button"
        className="min-h-11 self-start text-base font-medium text-muted-foreground"
        onClick={() => setOpen((current) => !current)}
      >
        {sore.active.length > 0
          ? `${sore.active.map((mark) => soreSpotLabel(mark.id)).join(", ")} побаливает до ${formatIsoDate(sore.active[0].until, "d MMM")}`
          : "Что-то болит"}
      </button>
      {open ? (
        <SessionSoreSpotPicker active={sore.active} onToggle={sore.toggle} />
      ) : null}
      {sore.active.length > 0 && !sore.eased ? (
        <Button
          type="button"
          variant="outline"
          className="min-h-11 self-start"
          disabled={disabled || sore.busy}
          onClick={() => void sore.easeWorkout(onEase)}
        >
          Облегчить эту тренировку на 15%
        </Button>
      ) : null}
    </section>
  );
}
