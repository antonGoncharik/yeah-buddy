import { trainingExtraCarbsG } from "@/lib/nutrition/suggest-protein";
import { getUserSettings, saveUserSettings } from "@/lib/settings";
import type { DayType, UserGoal } from "@/lib/types";
import {
  isHomeProgramPresetId,
  isProgramPresetId,
} from "@/lib/workout/program-presets";

const FORMULA_CARB_BUMPS = new Set([0, 25, 50, 75]);
const MAX_CARBS_G = 500;

export function carbsForDay(input: {
  dayType: DayType;
  restCarbs: number;
  trainingCarbs: number;
  deload: boolean;
}): number {
  if (input.dayType === "rest" || input.deload) {
    return input.restCarbs;
  }
  return input.trainingCarbs;
}

/**
 * Home programs drop the gym carb bump. A gym program puts it back.
 * A hand-edited gap that is not 0, 25, 50, or 75 g stays put.
 */
export async function syncTrainingCarbsToProgram(
  userId: string,
  presetId: string,
): Promise<void> {
  if (!isProgramPresetId(presetId)) {
    return;
  }
  const settings = await getUserSettings(userId);
  const goal = settings?.goal;
  if (!settings || !isUserGoal(goal)) {
    return;
  }
  const delta = settings.training_carbs - settings.rest_carbs;
  if (!FORMULA_CARB_BUMPS.has(delta)) {
    return;
  }
  const next = Math.min(
    MAX_CARBS_G,
    settings.rest_carbs +
      trainingExtraCarbsG({
        goal,
        load: isHomeProgramPresetId(presetId) ? "home" : "gym",
      }),
  );
  if (next === settings.training_carbs) {
    return;
  }
  await saveUserSettings(userId, {
    rest_protein: settings.rest_protein,
    rest_fat: settings.rest_fat,
    rest_carbs: settings.rest_carbs,
    training_protein: settings.training_protein,
    training_fat: settings.training_fat,
    training_carbs: next,
  });
}

function isUserGoal(value: UserGoal | null | undefined): value is UserGoal {
  return value === "lose" || value === "keep" || value === "gain";
}
