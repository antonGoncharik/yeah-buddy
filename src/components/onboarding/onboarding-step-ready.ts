import {
  proteinValid,
  weightDraftOk,
} from "@/components/onboarding/onboarding-draft";
import {
  LIFTS_DRAFT_INVALID,
  LIFTS_NEED_INPUT_OR_SKIP,
  type LiftAnswers,
  liftAnswersDraftInvalid,
  liftAnswersHaveInput,
} from "@/components/onboarding/onboarding-lifts-step";
import {
  ACTIVITY_REQUIRED,
  GOAL_REQUIRED,
  MODE_REQUIRED,
  PACE_REQUIRED,
  PROFILE_BIRTH_INVALID,
  PROFILE_HEIGHT_INVALID,
  PROTEIN_INVALID,
  RATION_REQUIRED,
  SEX_REQUIRED,
  TRAINING_AGE_REQUIRED,
  WEIGHT_INVALID,
  WEIGHT_REQUIRED,
} from "@/components/onboarding/onboarding-messages";
import type { OnboardingStep } from "@/components/onboarding/onboarding-steps";
import type { RationId } from "@/lib/food/ration";
import type { OnboardingGoal, OnboardingSex } from "@/lib/nutrition";
import type {
  UserActivityLevel,
  UserGoalPace,
  UserTrainingAge,
} from "@/lib/types";

export interface OnboardingStepBlock {
  message: string;
  step?: OnboardingStep;
}

export interface OnboardingAdvanceInput {
  step: OnboardingStep;
  gymEnabled: boolean | null;
  sex: OnboardingSex | null;
  weight: string;
  activity: UserActivityLevel | null;
  heightOk: boolean;
  birthYearOk: boolean;
  skipProfile: boolean;
  goal: OnboardingGoal | null;
  goalPace: UserGoalPace | null;
  trainingAge: UserTrainingAge | null;
  proteinValue: number | null;
  skipRation: boolean;
  ration: RationId | null;
  skipLifts: boolean;
  lifts: LiftAnswers;
}

export function onboardingAdvanceBlock(
  input: OnboardingAdvanceInput,
): OnboardingStepBlock | null {
  if (input.step === "mode" && input.gymEnabled == null) {
    return { message: MODE_REQUIRED };
  }
  if (input.step === "sex" && input.sex == null) {
    return { message: SEX_REQUIRED };
  }
  if (input.step === "weight") {
    if (input.sex == null) {
      return { message: SEX_REQUIRED, step: "sex" };
    }
    if (input.weight.trim() === "") {
      return { message: WEIGHT_REQUIRED };
    }
    if (!weightDraftOk(input.weight)) {
      return { message: WEIGHT_INVALID };
    }
  }
  if (input.step === "activity" && input.activity == null) {
    return { message: ACTIVITY_REQUIRED };
  }
  if (input.step === "profile" && !input.skipProfile) {
    if (!input.heightOk) {
      return { message: PROFILE_HEIGHT_INVALID };
    }
    if (!input.birthYearOk) {
      return { message: PROFILE_BIRTH_INVALID };
    }
  }
  if (input.step === "goal" && input.goal == null) {
    return { message: GOAL_REQUIRED };
  }
  if (
    input.step === "pace" &&
    input.goal != null &&
    input.goal !== "keep" &&
    input.goalPace == null
  ) {
    return { message: PACE_REQUIRED };
  }
  if (input.step === "training_age" && input.trainingAge == null) {
    return { message: TRAINING_AGE_REQUIRED };
  }
  if (input.step === "macros" && !proteinValid(input.proteinValue)) {
    return { message: PROTEIN_INVALID };
  }
  if (input.step === "ration" && !input.skipRation && input.ration == null) {
    return { message: RATION_REQUIRED };
  }
  if (input.step === "lifts" && !input.skipLifts) {
    if (!liftAnswersHaveInput(input.lifts)) {
      return { message: LIFTS_NEED_INPUT_OR_SKIP };
    }
    if (liftAnswersDraftInvalid(input.lifts)) {
      return { message: LIFTS_DRAFT_INVALID };
    }
  }
  return null;
}

export interface OnboardingFinishInput {
  omitProtein: boolean;
  sex: OnboardingSex | null;
  weight: string;
  goal: OnboardingGoal | null;
  activity: UserActivityLevel | null;
  goalPace: UserGoalPace | null;
  gymEnabled: boolean | null;
  trainingAge: UserTrainingAge | null;
  proteinValue: number | null;
}

export function onboardingFinishBlock(
  input: OnboardingFinishInput,
): OnboardingStepBlock | null {
  if (!input.omitProtein) {
    if (input.sex == null) {
      return { message: SEX_REQUIRED, step: "sex" };
    }
    if (!weightDraftOk(input.weight)) {
      return {
        message: input.weight.trim() === "" ? WEIGHT_REQUIRED : WEIGHT_INVALID,
        step: "weight",
      };
    }
    if (input.goal == null) {
      return { message: GOAL_REQUIRED, step: "goal" };
    }
    if (input.activity == null) {
      return { message: ACTIVITY_REQUIRED, step: "activity" };
    }
    if (input.goal != null && input.goal !== "keep" && input.goalPace == null) {
      return { message: PACE_REQUIRED, step: "pace" };
    }
    if (input.gymEnabled && input.trainingAge == null) {
      return { message: TRAINING_AGE_REQUIRED, step: "training_age" };
    }
    if (!proteinValid(input.proteinValue)) {
      return { message: PROTEIN_INVALID, step: "macros" };
    }
  }
  if (input.gymEnabled == null) {
    return { message: MODE_REQUIRED, step: "mode" };
  }
  return null;
}
