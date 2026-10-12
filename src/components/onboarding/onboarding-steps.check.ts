import {
  isOnboardingPersonStep,
  onboardingPersonSteps,
  onboardingStepAutoAdvance,
  onboardingStepInlineContinue,
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

const personGym = "sex,weight,activity,profile,goal,pace,training_age,macros";
const personFood = "sex,weight,activity,profile,goal,pace,macros";

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
  `mode,${personGym},ration`,
  "first run with gym",
);
assertEqual(
  onboardingSteps({ ...empty, gymEnabled: false }).join(),
  `mode,${personFood},ration`,
  "food-only skips program",
);
assertEqual(
  onboardingSteps({ ...empty, replay: true }).join(),
  personGym,
  "protein replay with gym",
);
assertEqual(
  onboardingSteps({ ...empty, replay: true, gymEnabled: false }).join(),
  personFood,
  "replay food-only is person steps only",
);
assertEqual(
  onboardingSteps({ ...empty, pendingKind: "workouts" }).join(),
  `mode,${personGym},ration`,
  "workout pack skips program after the intro",
);
assertEqual(
  onboardingSteps({ ...empty, pendingProgram: true }).join(),
  `mode,${personGym},ration`,
  "bot program skips the picker after the intro",
);
assertEqual(
  onboardingSteps({ ...empty, pendingKind: "meals", gymEnabled: true }).join(),
  "mode",
  "meal pack with gym",
);
assertEqual(
  onboardingSteps({ ...empty, pendingKind: "meals", gymEnabled: false }).join(),
  "mode",
  "meal pack food-only is mode only",
);
assertEqual(
  onboardingSteps({ ...empty, pendingKind: "meal", gymEnabled: false }).join(),
  `mode,${personFood},ration`,
  "one meal pack does not force gym steps",
);
assertEqual(
  onboardingSteps({ ...empty, pendingKind: "meal" }).join(),
  `mode,${personGym},ration`,
  "one meal pack with gym uses profile only",
);

for (const step of onboardingPersonSteps(true)) {
  const listed = onboardingSteps(empty);
  if (!listed.includes(step)) {
    throw new Error(`person step ${step} must stay in the first-run path`);
  }
}

assertEqual(onboardingStepAutoAdvance("mode"), true, "mode advances on pick");
assertEqual(onboardingStepAutoAdvance("sex"), true, "sex advances on pick");
assertEqual(onboardingStepAutoAdvance("activity"), true, "activity advances");
assertEqual(onboardingStepAutoAdvance("goal"), true, "goal advances on pick");
assertEqual(onboardingStepAutoAdvance("pace"), true, "pace advances on pick");
assertEqual(
  onboardingStepAutoAdvance("training_age"),
  true,
  "training age advances on pick",
);
assertEqual(
  onboardingStepAutoAdvance("ration"),
  true,
  "ration advances on pick",
);
assertEqual(
  onboardingStepInlineContinue("weight"),
  true,
  "weight continues inline",
);
assertEqual(
  onboardingStepInlineContinue("profile"),
  true,
  "profile continues inline",
);
assertEqual(
  onboardingStepInlineContinue("macros"),
  true,
  "macros continues inline",
);
assertEqual(onboardingStepNeedsNext("weight"), false, "weight skips sticky");
assertEqual(onboardingStepNeedsNext("macros"), false, "macros skips sticky");
assertEqual(onboardingStepNeedsNext("mode"), false, "mode hides Дальше");
assertEqual(onboardingStepNeedsNext("ration"), false, "ration hides Дальше");
assertEqual(
  onboardingSteps({ ...empty, replay: true }).includes("ration"),
  false,
  "replay keeps the current menu",
);
assertEqual(
  onboardingStepInlineContinue("lifts"),
  true,
  "lifts continues inline",
);
assertEqual(onboardingStepNeedsNext("lifts"), false, "lifts skips sticky");
assertEqual(onboardingStepNeedsNext("circle"), true, "circle needs Готово");
assertEqual(
  onboardingSteps({ ...empty, replay: true }).includes("lifts"),
  false,
  "replay skips anchor lifts",
);
assertEqual(isOnboardingPersonStep("weight"), true, "weight is person");
assertEqual(isOnboardingPersonStep("ration"), false, "ration is not person");

console.log("onboarding steps ok");
