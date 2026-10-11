import type { OnboardingProgramShelf } from "@/components/onboarding/onboarding-circle-step";
import type { OnboardingStep } from "@/components/onboarding/onboarding-steps";

export function onboardingWizardSub(
  step: OnboardingStep,
  guidePageIndex: number,
  programShelf: OnboardingProgramShelf | null,
): string | null {
  if (step === "guide") {
    return `g:${guidePageIndex}`;
  }
  if (step === "circle" && programShelf != null) {
    return `shelf:${programShelf}`;
  }
  return null;
}

export function parseGuidePageIndex(sub: string | null): number {
  if (sub == null || !sub.startsWith("g:")) {
    return 0;
  }
  const page = Number.parseInt(sub.slice(2), 10);
  return Number.isFinite(page) && page >= 0 ? page : 0;
}

export function parseProgramShelf(
  sub: string | null,
): OnboardingProgramShelf | null {
  if (sub == null || !sub.startsWith("shelf:")) {
    return null;
  }
  const shelf = sub.slice(6);
  return shelf === "home" || shelf === "all" ? shelf : null;
}
