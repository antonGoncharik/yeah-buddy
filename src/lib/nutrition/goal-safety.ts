import { ageFromBirthYear } from "@/lib/nutrition/profile-energy";
import type { UserGoal, UserGoalPace } from "@/lib/types";

export class UnsafeGoalError extends Error {
  constructor(message = "Эта цель сейчас не подходит.") {
    super(message);
    this.name = "UnsafeGoalError";
  }
}

export function bodyMassIndex(
  weightKg: number,
  heightCm: number,
): number | null {
  if (weightKg <= 0 || heightCm <= 0) {
    return null;
  }
  const meters = heightCm / 100;
  const bmi = weightKg / (meters * meters);
  return Number.isFinite(bmi) ? bmi : null;
}

export function cutGoalBlockedReason(input: {
  goal: UserGoal | null;
  height_cm: number | null;
  body_weight_kg: number | null;
  birth_year: number | null;
  nowYear?: number;
}): string | null {
  if (input.goal !== "lose") {
    return null;
  }
  const year = input.nowYear ?? new Date().getFullYear();
  const age =
    input.birth_year != null ? ageFromBirthYear(input.birth_year, year) : null;
  if (age != null && age < 18) {
    return "До 18 лет сушку в приложении не настраиваем — лучше с врачом.";
  }
  if (
    input.height_cm != null &&
    input.body_weight_kg != null &&
    input.height_cm >= 120
  ) {
    const bmi = bodyMassIndex(input.body_weight_kg, input.height_cm);
    if (bmi != null && bmi < 18.5) {
      return "При таком весе и росте сушка не подходит — выбери баланс или набор.";
    }
  }
  return null;
}

export function steepDeficitWarning(input: {
  goal: UserGoal | null;
  goal_pace: UserGoalPace | null;
  maintenanceKcal: number | null;
  targetKcal: number | null;
}): string | null {
  if (input.goal !== "lose") {
    return null;
  }
  if (
    input.maintenanceKcal == null ||
    input.targetKcal == null ||
    input.maintenanceKcal <= 0
  ) {
    return input.goal_pace === "fast"
      ? "Быстрый темп — большой дефицит. Если самочувствие просело, замедли темп в целях."
      : null;
  }
  const deficit =
    (input.maintenanceKcal - input.targetKcal) / input.maintenanceKcal;
  if (deficit > 0.25) {
    return "Дефицит больше четверти от расхода — проверь, что так комфортно.";
  }
  return null;
}

export function assertGoalSettingsAllowed(input: {
  goal: UserGoal | null;
  height_cm: number | null;
  body_weight_kg: number | null;
  birth_year: number | null;
}): void {
  const reason = cutGoalBlockedReason(input);
  if (reason) {
    throw new UnsafeGoalError(reason);
  }
}
