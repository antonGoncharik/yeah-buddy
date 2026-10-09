import type { SharePackKind } from "@/lib/share/payload";

export type OnboardingStep =
  | "mode"
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
    step === "guide" ||
    step === "mode" ||
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
  gymEnabled,
}: {
  pendingKind: SharePackKind | null;
  pendingProgram: boolean;
  replay: boolean;
  gymEnabled: boolean;
}): OnboardingStep[] {
  const forceGym =
    gymEnabled ||
    pendingKind === "workouts" ||
    pendingProgram ||
    pendingKind === "meal";

  if (replay) {
    if (forceGym) {
      return [...ONBOARDING_FOOD_STEPS, "lifts"];
    }
    return [...ONBOARDING_FOOD_STEPS];
  }

  const next: OnboardingStep[] = ["mode", "guide"];

  if (pendingKind !== "meals") {
    next.push(...ONBOARDING_FOOD_STEPS, "ration");
    if (forceGym) {
      next.push("lifts");
    }
  }

  if (forceGym && pendingKind !== "workouts" && !pendingProgram) {
    next.push("circle");
  }

  return next;
}
