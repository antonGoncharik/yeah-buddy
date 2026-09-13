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
  "food,circle",
  "first run setup has no guide step",
);
assertEqual(
  onboardingSteps({ ...empty, tour: true }).join(),
  "guide",
  "tour after setup is the full walkthrough",
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
  "food",
  "workout pack skips program",
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
  "circle",
  "meal pack skips protein",
);

console.log("onboarding steps ok");
