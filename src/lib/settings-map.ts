import { isRecord, toNumber } from "@/lib/read";
import type { UserSettings } from "@/lib/types";

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
    updated_at: String(row.updated_at),
  };
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
