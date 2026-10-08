import type { DayWithMeals } from "@/lib/day/map";
import type { UserSettings } from "@/lib/types";
import type { DayType } from "@/lib/types";

/** When false, the person uses food diary only; gym data stays in the DB. */
export function parseGymEnabled(value: unknown): boolean {
  return value !== false;
}

export function gymFeaturesEnabled(
  settings: Pick<UserSettings, "gym_enabled"> | null | undefined,
): boolean {
  return settings?.gym_enabled !== false;
}

export function effectiveTrainingDay(
  settings: Pick<UserSettings, "gym_enabled"> | null | undefined,
  day: Pick<DayWithMeals, "is_training_day"> | null | undefined,
): boolean {
  if (!gymFeaturesEnabled(settings)) {
    return false;
  }
  return day?.is_training_day === true;
}

export function resolveDayTypeForUser(
  settings: Pick<UserSettings, "gym_enabled"> | null | undefined,
  requested: DayType,
): DayType {
  if (!gymFeaturesEnabled(settings)) {
    return "rest";
  }
  return requested;
}
