import {
  isOnboardingGoal,
  isOnboardingSex,
} from "@/lib/nutrition/suggest-protein";
import { isRecord, toNumber } from "@/lib/read";
import { resolveTimeZone } from "@/lib/telegram/reminder-clock";
import type {
  UserGoal,
  UserSettings,
  UserSex,
  UserTrainingAge,
} from "@/lib/types";
import { isTrainingAge } from "@/lib/workout/estimate-maxes";
import { parseGrantedPrograms } from "@/lib/workout/program-presets";

export function mapSettings(row: Record<string, unknown>): UserSettings {
  return {
    user_id: String(row.user_id),
    rest_protein: toNumber(row.rest_protein),
    rest_fat: toNumber(row.rest_fat),
    rest_carbs: toNumber(row.rest_carbs),
    training_protein: toNumber(row.training_protein),
    training_fat: toNumber(row.training_fat),
    training_carbs: toNumber(row.training_carbs),
    onboarding_completed_at:
      typeof row.onboarding_completed_at === "string"
        ? row.onboarding_completed_at
        : null,
    reminders_enabled: row.reminders_enabled !== false,
    timezone: resolveTimeZone(
      typeof row.timezone === "string" ? row.timezone : null,
    ),
    training_years: parseStoredTrainingYears(row.training_years),
    sex: parseStoredSex(row.sex),
    goal: parseStoredGoal(row.goal),
    training_age: parseStoredTrainingAge(row.training_age),
    granted_programs: parseGrantedPrograms(row.granted_programs),
    updated_at: String(row.updated_at),
  };
}

export function parseStoredSex(value: unknown): UserSex | null {
  return isOnboardingSex(value) ? value : null;
}

export function parseStoredGoal(value: unknown): UserGoal | null {
  return isOnboardingGoal(value) ? value : null;
}

export function parseStoredTrainingAge(
  value: unknown,
): UserTrainingAge | null {
  return isTrainingAge(value) ? value : null;
}

export function parseUserSettings(value: unknown): UserSettings | null {
  if (!isRecord(value) || typeof value.user_id !== "string") {
    return null;
  }

  return mapSettings(value);
}

export function readSettingsPayload(data: unknown): UserSettings | null {
  return isRecord(data) ? parseUserSettings(data.settings) : null;
}

export function isOnboardingCompleted(settings: UserSettings): boolean {
  return settings.onboarding_completed_at != null;
}

export function parseStoredTrainingYears(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 80) {
    return null;
  }

  return parsed;
}
