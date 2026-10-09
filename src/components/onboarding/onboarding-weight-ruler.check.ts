import {
  ONBOARDING_WEIGHT_DEFAULT_FEMALE_KG,
  ONBOARDING_WEIGHT_DEFAULT_MALE_KG,
  ONBOARDING_WEIGHT_MAX_KG,
  ONBOARDING_WEIGHT_MIN_KG,
  onboardingDefaultWeightKg,
  onboardingWeightKgFromDraft,
} from "@/components/onboarding/onboarding-weight-ruler";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${String(actual)}, expected ${String(expected)}`,
    );
  }
}

assertEqual(onboardingDefaultWeightKg("male"), 80, "male default");
assertEqual(onboardingDefaultWeightKg("female"), 60, "female default");
assertEqual(onboardingDefaultWeightKg(null), 80, "unknown sex fallback");
assertEqual(onboardingWeightKgFromDraft("82"), 82, "integer draft");
assertEqual(onboardingWeightKgFromDraft("82.4"), 82, "rounds tenths");
assertEqual(
  onboardingWeightKgFromDraft("", "female"),
  ONBOARDING_WEIGHT_DEFAULT_FEMALE_KG,
  "empty with sex",
);
assertEqual(
  onboardingWeightKgFromDraft("", "male"),
  ONBOARDING_WEIGHT_DEFAULT_MALE_KG,
  "empty male",
);
assertEqual(
  onboardingWeightKgFromDraft("20"),
  ONBOARDING_WEIGHT_DEFAULT_MALE_KG,
  "below min",
);
assertEqual(
  onboardingWeightKgFromDraft("300"),
  ONBOARDING_WEIGHT_DEFAULT_MALE_KG,
  "above max",
);
assertEqual(ONBOARDING_WEIGHT_MIN_KG, 30, "min matches onboarding");
assertEqual(ONBOARDING_WEIGHT_MAX_KG, 250, "max matches onboarding");
