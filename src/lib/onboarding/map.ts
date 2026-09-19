import type { OnboardingCircle, OnboardingState } from "@/lib/onboarding/types";
import { isRecord } from "@/lib/read";
import { parseUserSettings } from "@/lib/settings/map";
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
    circle,
  };
}

function parseOnboardingCircle(value: unknown): OnboardingCircle | null {
  if (value === "empty" || isProgramPresetId(value)) {
    return value;
  }
  return null;
}
