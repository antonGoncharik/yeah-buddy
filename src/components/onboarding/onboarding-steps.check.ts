import {
  isOnboardingPersonStep,
  onboardingPersonSteps,
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
  gymEnabled: true,
};

const personGym = "sex,weight,goal,training_age,macros";
const personFood = "sex,weight,goal,macros";

assertEqual(
  onboardingPersonSteps(true).join(),
  personGym,
  "person steps with gym",
);
assertEqual(
  onboardingPersonSteps(false).join(),
  personFood,
  "person steps food-only",
);

assertEqual(
  onboardingSteps(empty).join(),
  `mode,guide,${personGym},ration,lifts,circle`,
  "first run with gym",
);
assertEqual(
  onboardingSteps({ ...empty, gymEnabled: false }).join(),
  `mode,guide,${personFood},ration`,
  "food-only skips lifts and program",
);
assertEqual(
  onboardingSteps({ ...empty, replay: true }).join(),
  `${personGym},lifts`,
  "protein replay with gym",
);
assertEqual(
  onboardingSteps({ ...empty, replay: true, gymEnabled: false }).join(),
  personFood,
  "replay food-only is person steps only",
);
assertEqual(
  onboardingSteps({ ...empty, pendingKind: "workouts" }).join(),
  `mode,guide,${personGym},ration,lifts`,
  "workout pack skips program after the intro",
);
assertEqual(
  onboardingSteps({ ...empty, pendingProgram: true }).join(),
  `mode,guide,${personGym},ration,lifts`,
  "bot program skips the picker after the intro",
);
assertEqual(
  onboardingSteps({ ...empty, pendingKind: "meals", gymEnabled: true }).join(),
  "mode,guide,circle",
  "meal pack with gym",
);
assertEqual(
  onboardingSteps({ ...empty, pendingKind: "meals", gymEnabled: false }).join(),
  "mode,guide",
  "meal pack food-only is mode then intro",
);
assertEqual(
  onboardingSteps({ ...empty, pendingKind: "meal" }).join(),
  `mode,guide,${personGym},ration,lifts,circle`,
  "one meal pack still asks protein, ration, lifts and program",
);

for (const step of onboardingPersonSteps(true)) {
  const listed = onboardingSteps(empty);
  if (!listed.includes(step)) {
    throw new Error(`person step ${step} must stay in the first-run path`);
  }
  assertEqual(
    onboardingStepNeedsNext(step),
    true,
    `${step} only advances with Дальше`,
  );
}

assertEqual(onboardingStepNeedsNext("mode"), true, "mode needs Дальше");
assertEqual(onboardingStepNeedsNext("ration"), true, "ration needs Дальше");
assertEqual(
  onboardingSteps({ ...empty, replay: true }).includes("ration"),
  false,
  "replay keeps the current menu",
);
assertEqual(onboardingStepNeedsNext("lifts"), true, "lifts needs Дальше");
assertEqual(onboardingStepNeedsNext("circle"), true, "circle needs Готово");
assertEqual(
  onboardingSteps({ ...empty, replay: true }).includes("sex"),
  true,
  "replay still walks person steps before lifts",
);
assertEqual(isOnboardingPersonStep("weight"), true, "weight is person");
assertEqual(isOnboardingPersonStep("ration"), false, "ration is not person");

console.log("onboarding steps ok");
