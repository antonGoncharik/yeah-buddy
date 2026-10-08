import {
  type EnergyDay,
  expenditureTrend,
  KCAL_PER_BODY_KG,
  recentFoodLogOk,
} from "@/lib/ai/energy";
import { formatKcalPlain } from "@/lib/ai/format";
import { formatSignedBodyWeight } from "@/lib/day/body-weight";
import { calcKcalFromMacros, type Macros } from "@/lib/nutrition/macros";
import { pluralDays } from "@/lib/nutrition/metric-copy";
import {
  macroGoalsForTargetKcal,
  suggestFatGramsForProfile,
  TRAINING_EXTRA_CARBS_G,
} from "@/lib/nutrition/suggest-protein";
import type { UserGoal, UserSex } from "@/lib/types";

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

/** At least this many food days in the weight window before moving macros. */
const OFFER_MIN_LOGGED_DAYS = 10;

/** Cap how far the rest-day kcal goal can jump per week (then trust still applies). */
const MAX_GOAL_SHIFT_KCAL_PER_WEEK = 175;

/** Under this the scale did not really move. */
const STEADY_KG = 0.15;

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
  sex: UserSex | null;
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
  if (
    coverage < OFFER_MIN_COVERAGE ||
    energy.logged < OFFER_MIN_LOGGED_DAYS ||
    !recentFoodLogOk(input.days, energy.to)
  ) {
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
  const maxShift = MAX_GOAL_SHIFT_KCAL_PER_WEEK * (energy.span / 7);
  const boundedIdeal = clampToward(currentKcal, ideal, maxShift);
  const trust =
    coverage >= OFFER_FULL_COVERAGE
      ? 1
      : (coverage - OFFER_MIN_COVERAGE) /
        (OFFER_FULL_COVERAGE - OFFER_MIN_COVERAGE);
  const target = clampGoalKcal(
    currentKcal + (boundedIdeal - currentKcal) * trust,
  );
  const rest = macroGoalsForTargetKcal({
    targetKcal: target,
    weightKg: energy.endKg,
    goal: input.goal,
    sex: input.sex,
    currentProtein: input.restProtein,
    currentFat: input.restFat,
    kcalGap: ENERGY_GOAL_GAP_KCAL,
  });
  if (Math.abs(rest.kcal - currentKcal) < ENERGY_GOAL_GAP_KCAL) {
    return null;
  }
  if (
    input.dismissedKcal != null &&
    Math.abs(rest.kcal - input.dismissedKcal) < ENERGY_GOAL_GAP_KCAL
  ) {
    return null;
  }

  const trainingProtein = Math.max(input.trainingProtein, rest.protein);
  const fatCut = Math.max(0, input.restFat - rest.fat);
  const trainingFat = lowerFat(
    input.trainingFat,
    fatCut,
    input.sex,
    energy.endKg,
    input.goal,
  );
  const trainingCarbs = Math.min(
    MAX_CARBS_G,
    rest.carbs + TRAINING_EXTRA_CARBS_G,
  );
  const training: Macros = {
    protein: trainingProtein,
    fat: trainingFat,
    carbs: trainingCarbs,
    kcal: calcKcalFromMacros(trainingProtein, trainingFat, trainingCarbs),
  };

  return {
    expenditure: energy.kcal,
    restKcal: rest.kcal,
    goal: input.goal,
    restCarbs: rest.carbs,
    trainingCarbs,
    rest: {
      protein: rest.protein,
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

function lowerFat(
  current: number,
  cut: number,
  sex: UserSex | null,
  weightKg: number,
  goal: UserGoal,
): number {
  if (cut <= 0) {
    return current;
  }
  const floor =
    suggestFatGramsForProfile({ sex, weightKg, goal }) ??
    (weightKg >= 30 ? 35 : 35);
  const next = current - cut;
  if (next >= floor) {
    return next;
  }
  if (current <= floor) {
    return current;
  }
  return floor;
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

function clampToward(current: number, ideal: number, maxDelta: number): number {
  if (!(maxDelta > 0) || !Number.isFinite(maxDelta)) {
    return ideal;
  }
  const diff = ideal - current;
  if (Math.abs(diff) <= maxDelta) {
    return ideal;
  }
  return current + Math.sign(diff) * maxDelta;
}
