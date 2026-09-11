import type { OnboardingCircle, OnboardingState } from "@/lib/onboarding/types";
import { isRecord, mapRecordList } from "@/lib/read";
import { parseUserSettings } from "@/lib/settings-map";
import { parseExerciseWithMax } from "@/lib/workout/map-rows";
import { isProgramPresetId } from "@/lib/workout/program-presets";

export function parseOnboardingState(data: unknown): OnboardingState | null {
  const row = isRecord(data) ? data.onboarding : null;
  if (!isRecord(row) || typeof row.completed !== "boolean") {
    return null;
  }

  const settings = parseUserSettings(row.settings);
  if (!settings) {
    return null;
  }

  const circle = parseOnboardingCircle(row.circle);
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

function parseOnboardingCircle(value: unknown): OnboardingCircle | null {
  if (value === "empty" || isProgramPresetId(value)) {
    return value;
  }
  return null;
}
