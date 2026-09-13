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
  circle: "empty" as const,
  state: null,
};

assertEqual(
  onboardingSteps(empty).join(),
  "guide,food,circle",
  "first run explains the diary before protein",
);
assertEqual(
  onboardingSteps({ ...empty, replay: true }).join(),
  "food",
  "protein replay skips the intro",
);
assertEqual(
  onboardingSteps({ ...empty, pendingKind: "workouts" }).join(),
  "guide,food",
  "workout pack skips program after the intro",
);
assertEqual(
  onboardingSteps({ ...empty, pendingKind: "meals" }).join(),
  "guide,circle",
  "meal pack skips protein after the intro",
);
assertEqual(
  onboardingSteps({ ...empty, replay: true, pendingKind: "meals" }).join(),
  "food",
  "replay always has at least the protein step",
);

console.log("onboarding steps ok");
