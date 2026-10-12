import { formatBodyWeight } from "@/lib/day/body-weight";
import { shiftIsoDate } from "@/lib/day/dates";
import { weeklyBodyRate } from "@/lib/nutrition/profile-energy";
import type { UserGoal, UserGoalPace } from "@/lib/types";

export const GOAL_FORECAST_WEEKS = 8;

export function goalForecastWeeklyKg(
  weightKg: number,
  goal: UserGoal,
  pace: UserGoalPace | null,
): number {
  const rate = weeklyBodyRate(goal, pace);
  return rate * weightKg;
}

/** Dashed-line values from the last weigh-in forward (includes anchor). */
export function goalForecastExtension(
  lastWeightKg: number,
  goal: UserGoal,
  pace: UserGoalPace | null,
  weeks = GOAL_FORECAST_WEEKS,
): number[] | null {
  if (goal === "keep" || !(lastWeightKg > 0)) {
    return null;
  }
  const weekly = goalForecastWeeklyKg(lastWeightKg, goal, pace);
  if (Math.abs(weekly) < 0.02) {
    return null;
  }
  const values = [lastWeightKg];
  for (let week = 1; week <= weeks; week += 1) {
    values.push(lastWeightKg + weekly * week);
  }
  return values;
}

export function goalForecastEndDate(
  lastDate: string,
  weeks = GOAL_FORECAST_WEEKS,
): string {
  return shiftIsoDate(lastDate, weeks * 7);
}

export function goalForecastLine(input: {
  weightKg: number;
  goal: UserGoal;
  pace: UserGoalPace | null;
  weeks?: number;
}): string | null {
  const weeks = input.weeks ?? GOAL_FORECAST_WEEKS;
  const extension = goalForecastExtension(
    input.weightKg,
    input.goal,
    input.pace,
    weeks,
  );
  if (!extension || extension.length < 2) {
    return null;
  }
  const endKg = extension[extension.length - 1];
  if (endKg == null) {
    return null;
  }
  const delta = endKg - input.weightKg;
  if (Math.abs(delta) < 0.05) {
    return null;
  }
  const direction =
    input.goal === "lose"
      ? "ниже"
      : input.goal === "gain"
        ? "выше"
        : delta < 0
          ? "ниже"
          : "выше";
  return `При выбранном темпе через ${weeks} нед. вес может быть на ${formatBodyWeight(Math.abs(delta))} кг ${direction} (около ${formatBodyWeight(endKg)} кг).`;
}
