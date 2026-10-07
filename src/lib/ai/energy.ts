import { formatKcalPlain } from "@/lib/ai/format";
import type { ReviewEnergy } from "@/lib/ai/types";
import { formatSignedBodyWeight, roundBodyWeight } from "@/lib/day/body-weight";
import { inclusiveDayCount } from "@/lib/day/dates";
import { pluralDays } from "@/lib/nutrition/metric-copy";

/**
 * kcal stored in 1 kg of body-weight change (about 3500 kcal per pound).
 * Expenditure is intake minus that change spread over the days between weigh-ins.
 */
export const KCAL_PER_BODY_KG = 7700;

/** Under a week the scale is mostly water. */
const MIN_SPAN_DAYS = 7;
const MIN_LOGGED_DAYS = 5;
/** Logged food has to cover at least half the days between the weigh-ins. */
const MIN_COVERAGE = 0.5;
/** Outside this the log or the scale is noise, not a burn. */
const MIN_KCAL = 900;
const MAX_KCAL = 5500;

export type EnergyDay = {
  date: string;
  fact_kcal: number;
  target_kcal: number;
  body_weight: number | null;
};

export function dynamicExpenditure(days: EnergyDay[]): ReviewEnergy | null {
  const weighed = days
    .filter(
      (item): item is EnergyDay & { body_weight: number } =>
        item.body_weight != null && item.body_weight > 0,
    )
    .sort((left, right) => left.date.localeCompare(right.date));
  const first = weighed[0];
  const last = weighed.at(-1);
  if (first == null || last == null || first.date === last.date) {
    return null;
  }

  const span = inclusiveDayCount(first.date, last.date) - 1;
  if (span < MIN_SPAN_DAYS) {
    return null;
  }

  const logged = days.filter(
    (item) =>
      item.date >= first.date && item.date <= last.date && item.fact_kcal > 0,
  );
  const windowDays = inclusiveDayCount(first.date, last.date);
  if (
    logged.length < MIN_LOGGED_DAYS ||
    windowDays <= 0 ||
    logged.length / windowDays < MIN_COVERAGE
  ) {
    return null;
  }

  const intake =
    logged.reduce((sum, item) => sum + item.fact_kcal, 0) / logged.length;
  const targetMean =
    logged.reduce((sum, item) => sum + item.target_kcal, 0) / logged.length;
  const delta = last.body_weight - first.body_weight;
  const kcal = intake - (delta * KCAL_PER_BODY_KG) / span;
  if (!Number.isFinite(kcal) || kcal < MIN_KCAL || kcal > MAX_KCAL) {
    return null;
  }

  return {
    kcal: round10(kcal),
    intake: round10(intake),
    target: targetMean > 0 ? round10(targetMean) : null,
    delta: roundBodyWeight(delta),
    span,
    logged: logged.length,
  };
}

export function energySignalLine(energy: ReviewEnergy): string {
  const move =
    energy.delta === 0
      ? "вес стоит"
      : `вес ${formatSignedBodyWeight(energy.delta)} кг`;
  const head = `Расход около ${formatKcalPlain(energy.kcal)} ккал/день за ${energy.span} ${pluralDays(energy.span)}: съедено ${formatKcalPlain(energy.intake)}, ${move}`;
  if (energy.target == null) {
    return `${head}.`;
  }
  return `${head}. Цель этих дней ${formatKcalPlain(energy.target)}.`;
}

function round10(value: number): number {
  return Math.round(value / 10) * 10;
}
