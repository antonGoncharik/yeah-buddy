"use client";

import { WorkoutsHubMacroCard } from "@/components/workout/workouts-hub-macro-card";
import { WorkoutsHubRotationList } from "@/components/workout/workouts-hub-rotation-list";
import { WorkoutsHubToolNav } from "@/components/workout/workouts-hub-tool-nav";
import type {
  CurrentMacroState,
  PhaseCircleProgress,
  WorkoutSession,
  WorkoutTemplateDetail,
} from "@/lib/types";

export function WorkoutsHubNavSections({
  macro,
  session,
  sessionTemplate,
  nextTemplate,
  phaseCircle,
  phaseHint,
  activeTemplates,
}: {
  macro: CurrentMacroState | null;
  session: WorkoutSession | null;
  sessionTemplate: WorkoutTemplateDetail | null;
  nextTemplate: WorkoutTemplateDetail | null;
  phaseCircle: PhaseCircleProgress | null;
  phaseHint: string | null;
  activeTemplates: WorkoutTemplateDetail[];
}) {
  return (
    <div
      className="animate-rise flex flex-col gap-6"
      style={{ animationDelay: "40ms" }}
    >
      <WorkoutsHubMacroCard
        macro={macro}
        phaseCircle={phaseCircle}
        phaseHint={phaseHint}
      />
      <WorkoutsHubRotationList
        session={session}
        sessionTemplate={sessionTemplate}
        nextTemplate={nextTemplate}
        activeTemplates={activeTemplates}
      />
      <WorkoutsHubToolNav />
    </div>
  );
}
