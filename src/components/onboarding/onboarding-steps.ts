import type { SharePackKind } from "@/lib/share/payload";

export type OnboardingStep = "guide" | "food" | "circle";

export function onboardingSteps({
  pendingKind,
  pendingProgram,
  replay,
}: {
  pendingKind: SharePackKind | null;
  pendingProgram: boolean;
  replay: boolean;
}): OnboardingStep[] {
  const next: OnboardingStep[] = [];
  if (!replay) {
    next.push("guide");
  }
  if (pendingKind !== "meals") {
    next.push("food");
  }
  if (!replay && pendingKind !== "workouts" && !pendingProgram) {
    next.push("circle");
  }
  if (next.length === 0) {
    next.push("food");
  }
  return next;
}
