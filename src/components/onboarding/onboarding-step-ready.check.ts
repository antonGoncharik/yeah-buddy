import { emptyLiftAnswers } from "@/components/onboarding/onboarding-draft";
import {
  MODE_REQUIRED,
  PROTEIN_INVALID,
  SEX_REQUIRED,
  WEIGHT_REQUIRED,
} from "@/components/onboarding/onboarding-messages";
import {
  type OnboardingAdvanceInput,
  onboardingAdvanceBlock,
  onboardingFinishBlock,
} from "@/components/onboarding/onboarding-step-ready";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    throw new Error(`${label}: got ${left}, expected ${right}`);
  }
}

function advance(
  patch: Partial<OnboardingAdvanceInput>,
): OnboardingAdvanceInput {
  return {
    step: "mode",
    gymEnabled: true,
    sex: "male",
    weight: "80",
    activity: "moderate",
    heightOk: true,
    birthYearOk: true,
    skipProfile: false,
    goal: "lose",
    goalPace: "normal",
    trainingAge: "beginner",
    proteinValue: 160,
    skipRation: false,
    ration: "usual",
    skipLifts: false,
    lifts: { ...emptyLiftAnswers(), squat: "100" },
    ...patch,
  };
}

assertEqual(
  onboardingAdvanceBlock(advance({ step: "mode", gymEnabled: null })),
  { message: MODE_REQUIRED },
  "mode required",
);
assertEqual(
  onboardingAdvanceBlock(advance({ step: "weight", sex: null })),
  { message: SEX_REQUIRED, step: "sex" },
  "weight without sex",
);
assertEqual(
  onboardingAdvanceBlock(advance({ step: "weight", weight: "" })),
  { message: WEIGHT_REQUIRED },
  "empty weight",
);
assertEqual(
  onboardingAdvanceBlock(advance({ step: "macros", proteinValue: 0 })),
  { message: PROTEIN_INVALID },
  "bad protein",
);
assertEqual(
  onboardingAdvanceBlock(
    advance({ step: "lifts", skipLifts: true, lifts: emptyLiftAnswers() }),
  ),
  null,
  "skipped lifts",
);
assertEqual(
  onboardingAdvanceBlock(advance({ step: "weight" })),
  null,
  "weight ok",
);

assertEqual(
  onboardingFinishBlock({
    omitProtein: false,
    sex: null,
    weight: "80",
    goal: "lose",
    activity: "moderate",
    goalPace: "normal",
    gymEnabled: true,
    trainingAge: "beginner",
    proteinValue: 160,
  }),
  { message: SEX_REQUIRED, step: "sex" },
  "finish needs sex",
);
assertEqual(
  onboardingFinishBlock({
    omitProtein: true,
    sex: null,
    weight: "",
    goal: null,
    activity: null,
    goalPace: null,
    gymEnabled: false,
    trainingAge: null,
    proteinValue: null,
  }),
  null,
  "meal pack skips the person",
);
