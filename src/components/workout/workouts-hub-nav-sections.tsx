"use client";

import { WorkoutsHubBarbellCard } from "@/components/workout/workouts-hub-barbell-card";
import { WorkoutsHubMacroCard } from "@/components/workout/workouts-hub-macro-card";
import { WorkoutsHubToolNav } from "@/components/workout/workouts-hub-tool-nav";
import type { CurrentMacroState, PhaseCircleProgress } from "@/lib/types";

export function WorkoutsHubNavSections({
  macro,
  phaseCircle,
  phaseHint,
}: {
  macro: CurrentMacroState | null;
  phaseCircle: PhaseCircleProgress | null;
  phaseHint: string | null;
}) {
  return (
    <details className="card-surface animate-rise px-5 py-3">
      <summary className="cursor-pointer text-lg font-semibold">
        Прогресс
      </summary>
      <div className="mt-4 flex flex-col gap-6">
        <WorkoutsHubMacroCard
          macro={macro}
          phaseCircle={phaseCircle}
          phaseHint={phaseHint}
        />
        <WorkoutsHubToolNav />
        <WorkoutsHubBarbellCard />
      </div>
    </details>
  );
}
