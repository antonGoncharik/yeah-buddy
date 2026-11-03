"use client";

import { WeekDoodle } from "@/components/layout/doodles";
import { NavRow } from "@/components/layout/nav-row";
import { CircleOpenedNote } from "@/components/workout/circle-opened-note";
import type { CurrentMacroState, PhaseCircleProgress } from "@/lib/types";
import { phaseLinkLabel } from "@/lib/workout/hints";
import { CYCLE_LABEL } from "@/lib/workout/labels";

export function WorkoutsHubMacroCard({
  macro,
  phaseCircle,
  phaseHint,
}: {
  macro: CurrentMacroState | null;
  phaseCircle: PhaseCircleProgress | null;
  phaseHint: string | null;
}) {
  if (macro?.macro && macro.phase) {
    const progress = phaseCircle ?? macro.phase_circle;
    return (
      <div>
        <NavRow
          href="/workouts/macro"
          title={CYCLE_LABEL}
          hint={
            phaseHint ??
            phaseLinkLabel(
              macro.macro.number,
              progress,
              macro.phase.phase_type,
              macro.phase.name,
            )
          }
          icon={<WeekDoodle />}
        />
        <CircleOpenedNote
          phaseId={macro.phase.id}
          open={progress?.opened_itself === true}
        />
      </div>
    );
  }

  if (macro && macro.planned_cycle.length > 0) {
    return (
      <NavRow
        href="/workouts/macro"
        title={CYCLE_LABEL}
        hint="Ещё не запущены"
        icon={<WeekDoodle />}
      />
    );
  }

  return null;
}
