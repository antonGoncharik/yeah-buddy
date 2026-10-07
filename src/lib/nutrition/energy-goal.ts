import { dynamicExpenditure, type EnergyDay } from "@/lib/ai/energy";
import { formatKcalPlain } from "@/lib/ai/format";
import { calcKcalFromMacros, type Macros } from "@/lib/nutrition/macros";
import {
  carbsForTargetKcal,
  TRAINING_EXTRA_CARBS_G,
} from "@/lib/nutrition/suggest-protein";
import type { UserGoal } from "@/lib/types";

/** Weigh-ins this far apart before a goal offer. Two weeks, not one noisy week. */
export const ENERGY_GOAL_MIN_SPAN_DAYS = 14;

/** Days of diary loaded to find that span. */
export const ENERGY_GOAL_LOOKBACK_DAYS = 28;

/** Under this the current goal already matches the suggestion. */
export const ENERGY_GOAL_GAP_KCAL = 100;

/**
 * How far the new rest-day goal sits from measured expenditure.
 * A cut is a modest deficit, a gain is a small surplus, keep matches the burn.
 */
export const ENERGY_GOAL_SHIFT_KCAL: Record<UserGoal, number> = {
  lose: -400,
  keep: 0,
  gain: 250,
};

const MIN_GOAL_KCAL = 1200;
const MAX_GOAL_KCAL = 4500;
const MAX_CARBS_G = 500;

export type EnergyGoalPlan = {
  expenditure: number;
  restKcal: number;
  goal: UserGoal;
  restCarbs: number;
  trainingCarbs: number;
  rest: Macros;
  training: Macros;
};

/** What Today shows. The server recomputes carbs on «Поставить». */
export type EnergyGoalOffer = Pick<
  EnergyGoalPlan,
  "expenditure" | "restKcal" | "goal"
>;

export function energyGoalOffer(input: {
  days: EnergyDay[];
  goal: UserGoal | null;
  restProtein: number;
  restFat: number;
  restCarbs: number;
  trainingProtein: number;
  trainingFat: number;
  dismissedKcal: number | null;
}): EnergyGoalPlan | null {
  if (input.goal == null) {
    return null;
  }

  const energy = dynamicExpenditure(input.days);
  if (energy == null || energy.span < ENERGY_GOAL_MIN_SPAN_DAYS) {
    return null;
  }

  const target = clampGoalKcal(
    energy.kcal + ENERGY_GOAL_SHIFT_KCAL[input.goal],
  );
  const restCarbs = carbsForTargetKcal(
    target,
    input.restProtein,
    input.restFat,
  );
  const restKcal = calcKcalFromMacros(
    input.restProtein,
    input.restFat,
    restCarbs,
  );
  const currentKcal = calcKcalFromMacros(
    input.restProtein,
    input.restFat,
    input.restCarbs,
  );
  if (Math.abs(restKcal - currentKcal) < ENERGY_GOAL_GAP_KCAL) {
    return null;
  }
  if (
    input.dismissedKcal != null &&
    Math.abs(restKcal - input.dismissedKcal) < ENERGY_GOAL_GAP_KCAL
  ) {
    return null;
  }

  const trainingCarbs = Math.min(
    MAX_CARBS_G,
    restCarbs + TRAINING_EXTRA_CARBS_G,
  );
  const training: Macros = {
    protein: input.trainingProtein,
    fat: input.trainingFat,
    carbs: trainingCarbs,
    kcal: calcKcalFromMacros(
      input.trainingProtein,
      input.trainingFat,
      trainingCarbs,
    ),
  };

  return {
    expenditure: energy.kcal,
    restKcal,
    goal: input.goal,
    restCarbs,
    trainingCarbs,
    rest: {
      protein: input.restProtein,
      fat: input.restFat,
      carbs: restCarbs,
      kcal: restKcal,
    },
    training,
  };
}

export function energyGoalPayload(
  plan: EnergyGoalPlan | null,
): EnergyGoalOffer | null {
  if (plan == null) {
    return null;
  }
  return {
    expenditure: plan.expenditure,
    restKcal: plan.restKcal,
    goal: plan.goal,
  };
}

export function energyGoalLine(offer: EnergyGoalOffer): string {
  const burn = formatKcalPlain(offer.expenditure);
  const goal = formatKcalPlain(offer.restKcal);
  if (offer.goal === "lose") {
    return `Расход около ${burn}. На сушку цель ${goal}.`;
  }
  if (offer.goal === "gain") {
    return `Расход около ${burn}. На набор цель ${goal}.`;
  }
  return `Расход около ${burn}. Держать около ${goal}.`;
}

function clampGoalKcal(value: number): number {
  if (value < MIN_GOAL_KCAL) {
    return MIN_GOAL_KCAL;
  }
  if (value > MAX_GOAL_KCAL) {
    return MAX_GOAL_KCAL;
  }
  return value;
}
