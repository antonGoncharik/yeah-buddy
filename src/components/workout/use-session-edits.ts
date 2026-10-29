"use client";

import type { SessionEditBridge } from "@/components/workout/session-edit-bridge";
import { useSessionExerciseEdits } from "@/components/workout/use-session-exercise-edits";
import { useSessionFlowEdits } from "@/components/workout/use-session-flow-edits";
import { useSessionSetEdits } from "@/components/workout/use-session-set-edits";

export function useSessionEdits(bridge: SessionEditBridge) {
  const sets = useSessionSetEdits(bridge);
  const exercises = useSessionExerciseEdits(bridge);
  const flow = useSessionFlowEdits(bridge);

  return {
    ...flow,
    ...exercises,
    ...sets,
  };
}
