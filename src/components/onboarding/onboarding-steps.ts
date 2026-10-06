import type { SharePackKind } from "@/lib/share/payload";

export type OnboardingStep =
  | "guide"
  | "profile"
  | "ration"
  | "lifts"
  | "circle";

export const ONBOARDING_FOOD_STEPS = [
  "profile",
] as const satisfies readonly OnboardingStep[];

export type OnboardingFoodStepId = (typeof ONBOARDING_FOOD_STEPS)[number];

export function isOnboardingFoodStep(
  step: OnboardingStep,
): step is OnboardingFoodStepId {
  return (ONBOARDING_FOOD_STEPS as readonly string[]).includes(step);
}

/** Steps that count toward setup progress (excludes the optional guide). */
export function onboardingSetupSteps(
  steps: OnboardingStep[],
): OnboardingStep[] {
  return steps.filter((id) => id !== "guide");
}

/** Profile, ration and lifts need «Дальше»; circle uses cards or Готово.
 * Meal-pack flow omits food steps (`pendingKind === "meals"`). Replay
 * recalculates protein and leaves the existing menu alone. */
export function onboardingStepNeedsNext(step: OnboardingStep): boolean {
  return (
    step === "profile" ||
    step === "ration" ||
    step === "lifts" ||
    step === "circle"
  );
}

export function onboardingSteps({
  pendingKind,
  pendingProgram,
  replay,
}: {
  pendingKind: SharePackKind | null;
  pendingProgram: boolean;
  replay: boolean;
}): OnboardingStep[] {
  if (replay) {
    return [...ONBOARDING_FOOD_STEPS, "lifts"];
  }

  const next: OnboardingStep[] = ["guide"];
  if (pendingKind !== "meals") {
    next.push(...ONBOARDING_FOOD_STEPS, "ration", "lifts");
  }
  if (pendingKind !== "workouts" && !pendingProgram) {
    next.push("circle");
  }
  return next;
}
