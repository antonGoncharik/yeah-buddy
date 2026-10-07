import {
  type EnergyDay,
  expenditureTrend,
  KCAL_PER_BODY_KG,
} from "@/lib/ai/energy";
import { formatKcalPlain } from "@/lib/ai/format";
import { formatSignedBodyWeight } from "@/lib/day/body-weight";
import { calcKcalFromMacros, type Macros } from "@/lib/nutrition/macros";
import { pluralDays } from "@/lib/nutrition/metric-copy";
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
 * Share of body weight to move in a week. A cut is about half a percent,
 * a gain about a quarter — floored and capped so a light or heavy person
 * does not get a silly rate.
 */
const WEEKLY_RATE: Record<UserGoal, number> = {
  lose: -0.005,
  keep: 0,
  gain: 0.0025,
};

const WEEKLY_KG_CAP: Record<UserGoal, { min: number; max: number }> = {
  lose: { min: 0.25, max: 0.7 },
  keep: { min: 0, max: 0 },
  gain: { min: 0.12, max: 0.35 },
};

/** Below this the log is too patchy to move the goal at all. */
const OFFER_MIN_COVERAGE = 0.75;

/** At this coverage the offer is the full correction, not a fraction of it. */
const OFFER_FULL_COVERAGE = 0.9;

/** Under this the scale did not really move. */
const STEADY_KG = 0.15;

/** Fat stays at least here, per kg, if carbs are already on the floor. */
const FAT_G_PER_KG_FLOOR = 0.6;

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
  delta: number;
  span: number;
};

/** What Today shows. The server recomputes carbs on «Поставить». */
export type EnergyGoalOffer = Pick<
  EnergyGoalPlan,
  "expenditure" | "restKcal" | "goal" | "delta" | "span"
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

  const energy = expenditureTrend(input.days);
  if (energy == null || energy.span < ENERGY_GOAL_MIN_SPAN_DAYS) {
    return null;
  }

  const windowDays = energy.span + 1;
  const coverage = windowDays > 0 ? energy.logged / windowDays : 0;
  if (coverage < OFFER_MIN_COVERAGE) {
    return null;
  }

  const currentKcal = calcKcalFromMacros(
    input.restProtein,
    input.restFat,
    input.restCarbs,
  );
  const ideal = clampGoalKcal(
    energy.kcal + goalShiftKcal(input.goal, energy.endKg),
  );
  const trust =
    coverage >= OFFER_FULL_COVERAGE
      ? 1
      : (coverage - OFFER_MIN_COVERAGE) /
        (OFFER_FULL_COVERAGE - OFFER_MIN_COVERAGE);
  const target = clampGoalKcal(currentKcal + (ideal - currentKcal) * trust);
  const rest = fillRestMacros(
    target,
    input.restProtein,
    input.restFat,
    energy.endKg,
  );
  if (Math.abs(rest.kcal - currentKcal) < ENERGY_GOAL_GAP_KCAL) {
    return null;
  }
  if (
    input.dismissedKcal != null &&
    Math.abs(rest.kcal - input.dismissedKcal) < ENERGY_GOAL_GAP_KCAL
  ) {
    return null;
  }

  const fatCut = Math.max(0, input.restFat - rest.fat);
  const trainingFat = lowerFat(input.trainingFat, fatCut, energy.endKg);
  const trainingCarbs = Math.min(
    MAX_CARBS_G,
    rest.carbs + TRAINING_EXTRA_CARBS_G,
  );
  const training: Macros = {
    protein: input.trainingProtein,
    fat: trainingFat,
    carbs: trainingCarbs,
    kcal: calcKcalFromMacros(input.trainingProtein, trainingFat, trainingCarbs),
  };

  return {
    expenditure: energy.kcal,
    restKcal: rest.kcal,
    goal: input.goal,
    restCarbs: rest.carbs,
    trainingCarbs,
    rest: {
      protein: input.restProtein,
      fat: rest.fat,
      carbs: rest.carbs,
      kcal: rest.kcal,
    },
    training,
    delta: energy.delta,
    span: energy.span,
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
    delta: plan.delta,
    span: plan.span,
  };
}

export function energyGoalLine(offer: EnergyGoalOffer): string {
  const burn = formatKcalPlain(offer.expenditure);
  const goal = formatKcalPlain(offer.restKcal);
  const scale =
    Math.abs(offer.delta) < STEADY_KG
      ? "Вес стоит."
      : `Вес ${formatSignedBodyWeight(offer.delta)} кг за ${offer.span} ${pluralDays(offer.span)}.`;
  if (offer.goal === "lose") {
    return `${scale} Расход около ${burn}. На сушку цель ${goal}.`;
  }
  if (offer.goal === "gain") {
    return `${scale} Расход около ${burn}. На набор цель ${goal}.`;
  }
  return `${scale} Расход около ${burn}. Держать около ${goal}.`;
}

function goalShiftKcal(goal: UserGoal, weightKg: number): number {
  const weekly = WEEKLY_RATE[goal];
  if (weekly === 0 || !(weightKg > 0)) {
    return 0;
  }
  const cap = WEEKLY_KG_CAP[goal];
  const magnitude = Math.min(
    cap.max,
    Math.max(cap.min, Math.abs(weekly) * weightKg),
  );
  const signed = weekly < 0 ? -magnitude : magnitude;
  return Math.round((signed * KCAL_PER_BODY_KG) / 7);
}

function fillRestMacros(
  target: number,
  protein: number,
  fat: number,
  weightKg: number,
): { fat: number; carbs: number; kcal: number } {
  let nextFat = fat;
  let carbs = carbsForTargetKcal(target, protein, nextFat);
  let kcal = calcKcalFromMacros(protein, nextFat, carbs);
  const floor = fatFloorGrams(weightKg);
  let guard = 0;
  while (
    kcal > target + ENERGY_GOAL_GAP_KCAL &&
    nextFat - 5 >= floor &&
    guard < 30
  ) {
    nextFat -= 5;
    carbs = carbsForTargetKcal(target, protein, nextFat);
    kcal = calcKcalFromMacros(protein, nextFat, carbs);
    guard += 1;
  }
  return { fat: nextFat, carbs, kcal };
}

function lowerFat(current: number, cut: number, weightKg: number): number {
  if (cut <= 0) {
    return current;
  }
  const floor = fatFloorGrams(weightKg);
  const next = current - cut;
  if (next >= floor) {
    return next;
  }
  if (current <= floor) {
    return current;
  }
  return floor;
}

function fatFloorGrams(weightKg: number): number {
  const stepped = Math.round((weightKg * FAT_G_PER_KG_FLOOR) / 5) * 5;
  if (stepped < 35) {
    return 35;
  }
  if (stepped > 150) {
    return 150;
  }
  return stepped;
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
