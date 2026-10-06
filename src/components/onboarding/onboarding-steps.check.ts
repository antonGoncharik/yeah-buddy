import {
  ONBOARDING_FOOD_STEPS,
  onboardingStepNeedsNext,
  onboardingSteps,
} from "@/components/onboarding/onboarding-steps";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

const empty = {
  pendingKind: null,
  pendingProgram: false,
  replay: false,
};

const food = "profile";

assertEqual(
  onboardingSteps(empty).join(),
  `guide,${food},ration,lifts,circle`,
  "first run is guide, profile, ration, lifts, program",
);
assertEqual(
  onboardingSteps({ ...empty, replay: true }).join(),
  `${food},lifts`,
  "protein replay skips the intro and program",
);
assertEqual(
  onboardingSteps({ ...empty, pendingKind: "workouts" }).join(),
  `guide,${food},ration,lifts`,
  "workout pack skips program after the intro",
);
assertEqual(
  onboardingSteps({ ...empty, pendingProgram: true }).join(),
  `guide,${food},ration,lifts`,
  "bot program skips the picker after the intro",
);
assertEqual(
  onboardingSteps({ ...empty, pendingKind: "meals" }).join(),
  "guide,circle",
  "meal pack skips protein and lifts after the intro",
);
assertEqual(
  onboardingSteps({ ...empty, pendingKind: "meal" }).join(),
  `guide,${food},ration,lifts,circle`,
  "one meal pack still asks protein, ration, lifts and program",
);
assertEqual(
  onboardingSteps({ ...empty, replay: true, pendingKind: "meals" }).join(),
  `${food},lifts`,
  "replay always has at least the protein and lifts steps",
);

for (const step of ONBOARDING_FOOD_STEPS) {
  const listed = onboardingSteps(empty);
  if (!listed.includes(step)) {
    throw new Error(`food step ${step} must stay in the first-run path`);
  }
  assertEqual(
    onboardingStepNeedsNext(step),
    true,
    `${step} only advances with Дальше`,
  );
}

assertEqual(onboardingStepNeedsNext("ration"), true, "ration needs Дальше");
assertEqual(
  onboardingSteps({ ...empty, replay: true }).includes("ration"),
  false,
  "replay keeps the current menu",
);
assertEqual(onboardingStepNeedsNext("lifts"), true, "lifts needs Дальше");
assertEqual(onboardingStepNeedsNext("circle"), true, "circle needs Готово");
assertEqual(
  onboardingSteps({ ...empty, replay: true }).includes("profile"),
  true,
  "replay still walks profile before lifts",
);

console.log("onboarding steps ok");
