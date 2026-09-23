import type { SharePackKind } from "@/lib/share/payload";

export type OnboardingStep =
  | "guide"
  | "sex"
  | "weight"
  | "goal"
  | "training_age"
  | "macros"
  | "lifts"
  | "circle";

export const ONBOARDING_FOOD_STEPS = [
  "sex",
  "weight",
  "goal",
  "training_age",
  "macros",
] as const satisfies readonly OnboardingStep[];

export type OnboardingFoodStepId = (typeof ONBOARDING_FOOD_STEPS)[number];

export function isOnboardingFoodStep(
  step: OnboardingStep,
): step is OnboardingFoodStepId {
  return (ONBOARDING_FOOD_STEPS as readonly string[]).includes(step);
}

/** Weight and macros need «Дальше»; sex / goal / training age advance on tap.
 * Food steps are required — no in-step «Пропустить». Meal-pack flow omits them
 * from the step list entirely (`pendingKind === "meals"`). */
export function onboardingStepNeedsNext(step: OnboardingStep): boolean {
  return (
    step === "weight" ||
    step === "macros" ||
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
    next.push(...ONBOARDING_FOOD_STEPS);
    next.push("lifts");
  }
  if (pendingKind !== "workouts" && !pendingProgram) {
    next.push("circle");
  }
  return next;
}
