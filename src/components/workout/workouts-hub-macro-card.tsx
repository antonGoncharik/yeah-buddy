"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { CircleOpenedNote } from "@/components/workout/circle-opened-note";
import { CycleTimeline } from "@/components/workout/cycle-timeline";
import type { CurrentMacroState, PhaseCircleProgress } from "@/lib/types";
import { cycleTimeline, phaseLinkLabel } from "@/lib/workout/hints";
import { CYCLE_LABEL } from "@/lib/workout/labels";

function MacroCycleHubLink({ children }: { children: ReactNode }) {
  return (
    <Link
      href="/workouts/macro"
      className="card-surface flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-muted/40"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">
          {CYCLE_LABEL}
        </p>
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
      </div>
      {children}
    </Link>
  );
}

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
    return (
      <MacroCycleHubLink>
        <p className="text-xl font-semibold tracking-tight">
          {phaseLinkLabel(
            macro.macro.number,
            phaseCircle ?? macro.phase_circle,
            macro.phase.phase_type,
            macro.phase.name,
          )}
        </p>
        {macro.planned_cycle.length > 0 ? (
          <CycleTimeline
            steps={cycleTimeline(
              macro.planned_cycle,
              macro.phase.phase_type,
              macro.phase.name,
            )}
          />
        ) : null}
        <CircleOpenedNote
          phaseId={macro.phase?.id ?? null}
          open={(phaseCircle ?? macro.phase_circle)?.opened_itself === true}
        />
        {phaseHint ? (
          <p className="text-base leading-snug">{phaseHint}</p>
        ) : null}
      </MacroCycleHubLink>
    );
  }

  if (macro && macro.planned_cycle.length > 0) {
    return (
      <MacroCycleHubLink>
        <p className="text-xl font-semibold tracking-tight">Ещё не запущены</p>
        <p className="text-base leading-snug text-muted-foreground">
          {macro.planned_cycle.map((phase) => phase.name).join(" → ")}. Те же
          дни, другой вес по кругу.
        </p>
      </MacroCycleHubLink>
    );
  }

  return null;
}
