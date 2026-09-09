import type { OnboardingState } from "@/lib/onboarding";
import { isRecord, mapRecordList } from "@/lib/read";
import { parseUserSettings } from "@/lib/settings-map";
import { parseExerciseWithMax } from "@/lib/workout/map-rows";

export function parseOnboardingState(data: unknown): OnboardingState | null {
  const row = isRecord(data) ? data.onboarding : null;
  if (!isRecord(row) || typeof row.completed !== "boolean") {
    return null;
  }

  const settings = parseUserSettings(row.settings);
  if (!settings) {
    return null;
  }

  const circle =
    row.circle === "empty" ||
    row.circle === "starter" ||
    row.circle === "upper_lower"
      ? row.circle
      : null;
  if (!circle) {
    return null;
  }

  return {
    completed: row.completed,
    settings,
    exercises: mapRecordList(row.exercises, (item) =>
      parseExerciseWithMax(item),
    ),
    circle,
    maxesLocked: row.maxesLocked === true,
  };
}
