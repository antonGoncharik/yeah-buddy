import type { SharePackKind } from "@/lib/share/payload";

export type OnboardingStep =
  | "mode"
  | "guide"
  | "sex"
  | "weight"
  | "goal"
  | "training_age"
  | "macros"
  | "ration"
  | "lifts"
  | "circle";

const PERSON_STEP_IDS = [
  "sex",
  "weight",
  "goal",
  "training_age",
  "macros",
] as const satisfies readonly OnboardingStep[];

export type OnboardingPersonStepId = (typeof PERSON_STEP_IDS)[number];

export function isOnboardingPersonStep(
  step: OnboardingStep,
): step is OnboardingPersonStepId {
  return (PERSON_STEP_IDS as readonly string[]).includes(step);
}

/** Пол, вес, цель, при зале — стаж, затем сводка по БЖУ. */
export function onboardingPersonSteps(gymEnabled: boolean): OnboardingStep[] {
  const steps: OnboardingStep[] = ["sex", "weight", "goal"];
  if (gymEnabled) {
    steps.push("training_age");
  }
  steps.push("macros");
  return steps;
}

/** Steps that count toward setup progress (excludes the optional guide). */
export function onboardingSetupSteps(
  steps: OnboardingStep[],
): OnboardingStep[] {
  return steps.filter((id) => id !== "guide");
}

/** Choice steps advance on tap; weight, macros summary and lifts keep «Дальше». */
export function onboardingStepAutoAdvance(step: OnboardingStep): boolean {
  return (
    step === "mode" ||
    step === "sex" ||
    step === "goal" ||
    step === "training_age" ||
    step === "ration"
  );
}

export function onboardingStepNeedsNext(step: OnboardingStep): boolean {
  if (onboardingStepAutoAdvance(step)) {
    return false;
  }
  return (
    step === "guide" ||
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

  const person = onboardingPersonSteps(forceGym);

  if (replay) {
    if (forceGym) {
      return [...person, "lifts"];
    }
    return [...person];
  }

  const next: OnboardingStep[] = ["mode", "guide"];

  if (pendingKind !== "meals") {
    next.push(...person, "ration");
    if (forceGym) {
      next.push("lifts");
    }
  }

  if (forceGym && pendingKind !== "workouts" && !pendingProgram) {
    next.push("circle");
  }

  return next;
}
