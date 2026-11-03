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
    <section className="card-surface animate-rise divide-y divide-border/70 px-5 py-2">
      <WorkoutsHubMacroCard
        macro={macro}
        phaseCircle={phaseCircle}
        phaseHint={phaseHint}
      />
      <WorkoutsHubToolNav />
      <WorkoutsHubBarbellCard />
    </section>
  );
}
