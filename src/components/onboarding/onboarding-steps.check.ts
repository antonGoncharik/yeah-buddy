import { onboardingSteps } from "@/components/onboarding/onboarding-steps";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

const empty = {
  pendingKind: null,
  replay: false,
  tour: false,
  circle: "empty" as const,
  state: null,
};

assertEqual(
  onboardingSteps(empty).join(),
  "guide,food,circle",
  "first run explains the diary before protein",
);
assertEqual(
  onboardingSteps({ ...empty, tour: true }).join(),
  "guide",
  "settings replay is the walkthrough only",
);
assertEqual(
  onboardingSteps({ ...empty, replay: true }).join(),
  "food",
  "protein replay stays setup",
);
assertEqual(
  onboardingSteps({ ...empty, replay: true, tour: true }).join(),
  "food",
  "replay wins over tour",
);
assertEqual(
  onboardingSteps({ ...empty, pendingKind: "workouts" }).join(),
  "guide,food",
  "workout pack skips program after the walkthrough",
);
assertEqual(
  onboardingSteps({
    ...empty,
    pendingKind: "workouts",
    tour: true,
  }).join(),
  "guide",
  "tour still available after a pack",
);
assertEqual(
  onboardingSteps({ ...empty, pendingKind: "meals" }).join(),
  "guide,circle",
  "meal pack skips protein after the walkthrough",
);

console.log("onboarding steps ok");
