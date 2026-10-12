"use client";

import { useEffect } from "react";

import { TickRuler } from "@/components/onboarding/tick-ruler";
import type { OnboardingSex } from "@/lib/nutrition";
import { parseDecimal } from "@/lib/workout/numbers";

export const ONBOARDING_WEIGHT_MIN_KG = 30;
export const ONBOARDING_WEIGHT_MAX_KG = 250;
export const ONBOARDING_WEIGHT_DEFAULT_MALE_KG = 80;
export const ONBOARDING_WEIGHT_DEFAULT_FEMALE_KG = 60;

/** @deprecated Use `onboardingDefaultWeightKg`. */
export const ONBOARDING_WEIGHT_DEFAULT_KG = ONBOARDING_WEIGHT_DEFAULT_MALE_KG;

export function onboardingDefaultWeightKg(sex: OnboardingSex | null): number {
  if (sex === "female") {
    return ONBOARDING_WEIGHT_DEFAULT_FEMALE_KG;
  }
  if (sex === "male") {
    return ONBOARDING_WEIGHT_DEFAULT_MALE_KG;
  }
  return ONBOARDING_WEIGHT_DEFAULT_MALE_KG;
}

export function isOnboardingPresetWeightKg(kg: number): boolean {
  return (
    kg === ONBOARDING_WEIGHT_DEFAULT_MALE_KG ||
    kg === ONBOARDING_WEIGHT_DEFAULT_FEMALE_KG ||
    kg === 65
  );
}

export function onboardingWeightKgFromDraft(
  raw: string,
  sex: OnboardingSex | null = null,
): number {
  const parsed = parseDecimal(raw);
  if (
    parsed != null &&
    parsed >= ONBOARDING_WEIGHT_MIN_KG &&
    parsed <= ONBOARDING_WEIGHT_MAX_KG
  ) {
    return Math.round(parsed);
  }
  return onboardingDefaultWeightKg(sex);
}

export function OnboardingWeightRuler({
  sex,
  weight,
  invalid,
  onChange,
}: {
  sex: OnboardingSex;
  weight: string;
  invalid: boolean;
  onChange: (value: string) => void;
}) {
  const kg = onboardingWeightKgFromDraft(weight, sex);

  useEffect(() => {
    if (weight.trim() === "") {
      onChange(String(onboardingDefaultWeightKg(sex)));
    }
  }, [onChange, sex, weight]);

  return (
    <TickRuler
      min={ONBOARDING_WEIGHT_MIN_KG}
      max={ONBOARDING_WEIGHT_MAX_KG}
      value={kg}
      invalid={invalid}
      unit="кг"
      ariaLabel="Вес тела"
      onChange={(next) => onChange(String(next))}
    />
  );
}
