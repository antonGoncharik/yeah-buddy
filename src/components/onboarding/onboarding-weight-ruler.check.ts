import {
  ONBOARDING_WEIGHT_DEFAULT_KG,
  ONBOARDING_WEIGHT_MAX_KG,
  ONBOARDING_WEIGHT_MIN_KG,
  onboardingWeightKgFromDraft,
} from "@/components/onboarding/onboarding-weight-ruler";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${String(actual)}, expected ${String(expected)}`,
    );
  }
}

assertEqual(onboardingWeightKgFromDraft("82"), 82, "integer draft");
assertEqual(onboardingWeightKgFromDraft("82.4"), 82, "rounds tenths");
assertEqual(ONBOARDING_WEIGHT_DEFAULT_KG, 65, "default kg");
assertEqual(onboardingWeightKgFromDraft(""), ONBOARDING_WEIGHT_DEFAULT_KG, "empty");
assertEqual(
  onboardingWeightKgFromDraft("20"),
  ONBOARDING_WEIGHT_DEFAULT_KG,
  "below min",
);
assertEqual(
  onboardingWeightKgFromDraft("300"),
  ONBOARDING_WEIGHT_DEFAULT_KG,
  "above max",
);
assertEqual(ONBOARDING_WEIGHT_MIN_KG, 30, "min matches onboarding");
assertEqual(ONBOARDING_WEIGHT_MAX_KG, 250, "max matches onboarding");
