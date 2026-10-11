import type { LiftAnswers } from "@/components/onboarding/onboarding-lifts-step";
import {
  isOnboardingPresetWeightKg,
  onboardingDefaultWeightKg,
} from "@/components/onboarding/onboarding-weight-ruler";
import { decimalDraftLooksValid } from "@/lib/form/numeric-draft";
import type { OnboardingSex } from "@/lib/nutrition";
import { parseDecimal } from "@/lib/workout/numbers";

export function weightAfterSexPick(
  value: OnboardingSex,
  current: string,
): string {
  const nextDefault = String(onboardingDefaultWeightKg(value));
  if (current.trim() === "") {
    return nextDefault;
  }
  const kg = parseDecimal(current);
  if (kg == null) {
    return nextDefault;
  }
  const rounded = Math.round(kg);
  if (isOnboardingPresetWeightKg(rounded)) {
    return nextDefault;
  }
  return current;
}

export function proteinValid(value: number | null): value is number {
  return value != null && value > 0 && value <= 400;
}

export function weightValid(value: number | null): value is number {
  return value != null && value >= 30 && value <= 250;
}

export function weightDraftOk(raw: string): boolean {
  return decimalDraftLooksValid(raw) && weightValid(parseDecimal(raw));
}

export function emptyLiftAnswers(): LiftAnswers {
  return { squat: "", bench: "", deadlift: "" };
}

export function parseLiftKg(raw: string | null): number | null {
  if (raw == null || raw.trim() === "") {
    return null;
  }
  const value = parseDecimal(raw);
  if (value == null || !(value > 0) || value > 500) {
    return null;
  }
  return value;
}

export function optionalHeightCm(raw: string): {
  ok: boolean;
  cm: number | null;
} {
  if (raw.trim() === "") {
    return { ok: true, cm: null };
  }
  const cm = parseDecimal(raw);
  if (cm == null || cm < 120 || cm > 230) {
    return { ok: false, cm: null };
  }
  return { ok: true, cm };
}

export function optionalBirthYear(raw: string): {
  ok: boolean;
  year: number | null;
} {
  if (raw.trim() === "") {
    return { ok: true, year: null };
  }
  const year = Number.parseInt(raw, 10);
  if (!Number.isFinite(year) || year < 1940 || year > 2015) {
    return { ok: false, year: null };
  }
  return { ok: true, year };
}
