"use client";

import { SheetFrame } from "@/components/layout/sheet-frame";
import { Button } from "@/components/ui/button";
import { calendarToday } from "@/lib/day/dates";
import type { MuscleId } from "@/lib/types";
import type { SessionSwapOption } from "@/lib/workout/session-swap-options";
import { activeSoreMarks, soreMuscles } from "@/lib/workout/sore";
import { readStoredSoreMarks } from "@/lib/workout/sore-marks";

export function SessionSwapSheetContent({
  muscle,
  muscleId,
  options,
  loading,
  error,
  pendingId,
  onCancel,
  onPick,
}: {
  muscle: string | null;
  muscleId: MuscleId | null;
  options: SessionSwapOption[];
  loading: boolean;
  error: string | null;
  pendingId: string | null;
  onCancel: () => void;
  onPick: (exerciseId: string, name: string) => void;
}) {
  const sore = soreMuscles(
    activeSoreMarks(readStoredSoreMarks(), calendarToday()),
  );
  const muscleSore = muscleId != null && sore.includes(muscleId);

  return (
    <SheetFrame
      title={muscle ? `Чем заменить · ${muscle}` : "Чем заменить"}
      onCancel={onCancel}
    >
      {error ? <p className="text-base text-destructive">{error}</p> : null}
      {loading ? (
        <p className="text-base text-muted-foreground">Смотрю ту же мышцу…</p>
      ) : null}
      {muscleSore ? (
        <p className="text-base leading-snug text-muted-foreground">
          Эта мышца болит. Замена останется в той же зоне.
        </p>
      ) : null}
      {!loading && !error && options.length === 0 ? (
        <p className="text-base text-muted-foreground">
          На эту мышцу больше нечего подставить.
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <Button
            key={option.exerciseId}
            type="button"
            variant="outline"
            className="h-auto min-h-12 justify-start py-2 text-left text-base"
            disabled={pendingId != null}
            onClick={() => onPick(option.exerciseId, option.name)}
          >
            <span className="flex min-w-0 flex-col items-start">
              <span>{option.name}</span>
              {option.line ? (
                <span className="text-sm font-normal text-muted-foreground">
                  {option.line}
                </span>
              ) : null}
            </span>
          </Button>
        ))}
      </div>
    </SheetFrame>
  );
}
