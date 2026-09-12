import type { OnboardingCircle, OnboardingState } from "@/lib/onboarding";
import { onboardingWeightExercises } from "@/lib/onboarding/setup";
import type { SharePackKind } from "@/lib/share/payload";
import { isProgramPresetId } from "@/lib/workout/program-presets";

export type OnboardingStep = "food" | "circle" | "maxes";

export function onboardingSteps({
  pendingKind,
  replay,
  circle,
  state,
}: {
  pendingKind: SharePackKind | null;
  replay: boolean;
  circle: OnboardingCircle;
  state: OnboardingState | null;
}): OnboardingStep[] {
  const weightExercises = state
    ? onboardingWeightExercises(circle, state.exercises)
    : [];
  const next: OnboardingStep[] = [];
  if (pendingKind !== "meals") {
    next.push("food");
  }
  if (!replay && pendingKind !== "workouts") {
    next.push("circle");
  }
  if (
    pendingKind !== "workouts" &&
    isProgramPresetId(circle) &&
    state &&
    !state.maxesLocked &&
    weightExercises.length > 0
  ) {
    next.push("maxes");
  }
  if (next.length === 0) {
    next.push("food");
  }
  return next;
}
