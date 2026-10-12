import { ageFromBirthYear } from "@/lib/nutrition/profile-energy";
import type { UserSex } from "@/lib/types";

export const BODY_HEIGHT_MIN_CM = 120;
export const BODY_HEIGHT_MAX_CM = 230;
export const BODY_HEIGHT_FEMALE_CM = 165;
export const BODY_HEIGHT_MALE_CM = 175;
export const BODY_AGE_DEFAULT = 30;
export const BIRTH_YEAR_MIN = 1940;
export const BIRTH_YEAR_MAX = 2015;

export function defaultBodyHeightCm(sex: UserSex | null): number {
  return sex === "female" ? BODY_HEIGHT_FEMALE_CM : BODY_HEIGHT_MALE_CM;
}

export function isPresetBodyHeightCm(cm: number): boolean {
  return cm === BODY_HEIGHT_FEMALE_CM || cm === BODY_HEIGHT_MALE_CM;
}

/** Ages whose birth year fits 1940–2015 and the calorie formula (at least 10). */
export function profileAgeBounds(nowYear: number): {
  min: number;
  max: number;
} {
  const min = Math.max(10, nowYear - BIRTH_YEAR_MAX);
  const max = nowYear - BIRTH_YEAR_MIN;
  if (max < min) {
    return { min, max: min };
  }
  return { min, max };
}

export function bodyAgeOptions(nowYear: number): number[] {
  const { min, max } = profileAgeBounds(nowYear);
  return inclusiveRange(min, max);
}

export function birthYearFromAge(age: number, nowYear: number): number | null {
  if (!Number.isInteger(age)) {
    return null;
  }
  const { min, max } = profileAgeBounds(nowYear);
  if (age < min || age > max) {
    return null;
  }
  return nowYear - age;
}

export function ageYearsLabel(age: number): string {
  const n = Math.abs(Math.trunc(age)) % 100;
  const last = n % 10;
  if (n > 10 && n < 20) {
    return "лет";
  }
  if (last === 1) {
    return "год";
  }
  if (last >= 2 && last <= 4) {
    return "года";
  }
  return "лет";
}

export function ageInputFromBirthYear(
  year: number | null,
  nowYear: number,
): string {
  const age = ageFromBirthYear(year, nowYear);
  return age == null ? "" : String(age);
}

export function parseAgeInput(
  raw: string,
  nowYear: number,
): { ok: true; year: number | null } | { ok: false } {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return { ok: true, year: null };
  }
  if (!/^\d{1,3}$/.test(trimmed)) {
    return { ok: false };
  }
  const year = birthYearFromAge(Number(trimmed), nowYear);
  if (year == null) {
    return { ok: false };
  }
  return { ok: true, year };
}

export function parseHeightInput(
  raw: string,
): { ok: true; cm: number | null } | { ok: false } {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return { ok: true, cm: null };
  }
  const value = Number(trimmed.replace(",", "."));
  if (
    !Number.isFinite(value) ||
    value < BODY_HEIGHT_MIN_CM ||
    value > BODY_HEIGHT_MAX_CM
  ) {
    return { ok: false };
  }
  return { ok: true, cm: value };
}

/** Wheel value shown before the person confirms. Empty draft keeps the sex default. */
export function profileHeightCm(raw: string, sex: UserSex | null): number {
  const parsed = parseHeightInput(raw);
  if (!parsed.ok || parsed.cm == null) {
    return defaultBodyHeightCm(sex);
  }
  return Math.min(
    BODY_HEIGHT_MAX_CM,
    Math.max(BODY_HEIGHT_MIN_CM, Math.round(parsed.cm)),
  );
}

export function profileAgeYears(rawYear: string, nowYear: number): number {
  const { min, max } = profileAgeBounds(nowYear);
  const fallback = Math.min(max, Math.max(min, BODY_AGE_DEFAULT));
  const trimmed = rawYear.trim();
  if (!/^\d{4}$/.test(trimmed)) {
    return fallback;
  }
  const age = ageFromBirthYear(Number(trimmed), nowYear);
  if (age == null) {
    return fallback;
  }
  return Math.min(max, Math.max(min, age));
}

/** null clears a saved stat. undefined keeps what is already stored. */
export function explicitOrStored(
  input: number | null | undefined,
  stored: number | null,
): number | null {
  return input === undefined ? stored : input;
}

function inclusiveRange(min: number, max: number): number[] {
  if (max < min) {
    return [min];
  }
  return Array.from({ length: max - min + 1 }, (_, index) => min + index);
}
