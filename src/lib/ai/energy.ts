import { formatKcalPlain } from "@/lib/ai/format";
import type { ReviewEnergy } from "@/lib/ai/types";
import { formatSignedBodyWeight, roundBodyWeight } from "@/lib/day/body-weight";
import { inclusiveDayCount, shiftIsoDate } from "@/lib/day/dates";
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
/**
 * A jump this large that comes back, or sits on the end of an otherwise
 * steady series within a few days, is water — not the trend.
 */
const SPIKE_KG = 1.2;
const SPIKE_DAYS = 5;

export type EnergyDay = {
  date: string;
  fact_kcal: number;
  target_kcal: number;
  body_weight: number | null;
};

type WeighIn = { date: string; body_weight: number };

/** Trend behind the burn. `endKg` is the late half of the scale, not one salty morning. */
export type ExpenditureTrend = ReviewEnergy & { endKg: number };

export function dynamicExpenditure(days: EnergyDay[]): ReviewEnergy | null {
  const trend = expenditureTrend(days);
  if (trend == null) {
    return null;
  }
  return {
    kcal: trend.kcal,
    intake: trend.intake,
    target: trend.target,
    delta: trend.delta,
    span: trend.span,
    logged: trend.logged,
  };
}

export function expenditureTrend(days: EnergyDay[]): ExpenditureTrend | null {
  const weighed = days
    .filter(
      (item): item is EnergyDay & { body_weight: number } =>
        item.body_weight != null && item.body_weight > 0,
    )
    .sort((left, right) => left.date.localeCompare(right.date));
  const trend = weightTrend(withoutSpikes(weighed));
  if (trend == null || trend.span < MIN_SPAN_DAYS) {
    return null;
  }

  const logged = days.filter(
    (item) =>
      item.date >= trend.from && item.date <= trend.to && item.fact_kcal > 0,
  );
  const windowDays = inclusiveDayCount(trend.from, trend.to);
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
  const kcal = intake - (trend.delta * KCAL_PER_BODY_KG) / trend.span;
  if (!Number.isFinite(kcal) || kcal < MIN_KCAL || kcal > MAX_KCAL) {
    return null;
  }

  return {
    kcal: round10(kcal),
    intake: round10(intake),
    target: targetMean > 0 ? round10(targetMean) : null,
    delta: trend.delta,
    span: trend.span,
    logged: logged.length,
    endKg: trend.endKg,
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

function daysBetween(from: string, to: string): number {
  return inclusiveDayCount(from, to) - 1;
}

function withoutSpikes(points: WeighIn[]): WeighIn[] {
  return points.filter((_point, index) => !isSpike(points, index));
}

function isSpike(points: WeighIn[], index: number): boolean {
  const point = points[index];
  const prev = points[index - 1];
  const next = points[index + 1];
  if (point == null) {
    return false;
  }
  if (prev != null && next != null) {
    const gapIn = daysBetween(prev.date, point.date);
    const gapOut = daysBetween(point.date, next.date);
    if (gapIn >= SPIKE_DAYS && gapOut >= SPIKE_DAYS) {
      return false;
    }
    const rise = point.body_weight - prev.body_weight;
    const fall = next.body_weight - point.body_weight;
    return (
      Math.abs(rise) > SPIKE_KG &&
      Math.abs(fall) > SPIKE_KG &&
      Math.sign(rise) !== Math.sign(fall) &&
      rise !== 0
    );
  }

  const neighbor = prev ?? next;
  const anchor = prev != null ? points[index - 2] : points[index + 2];
  if (neighbor == null || anchor == null) {
    return false;
  }
  const gap = daysBetween(
    prev != null ? neighbor.date : point.date,
    prev != null ? point.date : neighbor.date,
  );
  if (gap <= 0 || gap >= SPIKE_DAYS) {
    return false;
  }
  if (Math.abs(point.body_weight - neighbor.body_weight) <= SPIKE_KG) {
    return false;
  }
  return Math.abs(neighbor.body_weight - anchor.body_weight) <= SPIKE_KG;
}

function weightTrend(points: WeighIn[]): {
  from: string;
  to: string;
  delta: number;
  span: number;
  endKg: number;
} | null {
  const first = points[0];
  const last = points.at(-1);
  if (first == null || last == null || first.date === last.date) {
    return null;
  }

  const mid = Math.floor(points.length / 2);
  const early = points.slice(0, Math.max(mid, 1));
  const late = points.slice(mid);
  const earlyKg = median(early.map((item) => item.body_weight));
  const lateKg = median(late.map((item) => item.body_weight));
  const earlyDate = centerDate(early);
  const lateDate = centerDate(late);
  const anchorSpan = daysBetween(earlyDate, lateDate);
  const span = daysBetween(first.date, last.date);
  if (anchorSpan <= 0 || span <= 0) {
    return null;
  }

  const rate = (lateKg - earlyKg) / anchorSpan;
  return {
    from: first.date,
    to: last.date,
    span,
    delta: roundBodyWeight(rate * span),
    endKg: roundBodyWeight(lateKg),
  };
}

function centerDate(points: WeighIn[]): string {
  const first = points[0];
  if (first == null) {
    return "";
  }
  const mid = (points.length - 1) / 2;
  const lo = Math.floor(mid);
  const hi = Math.ceil(mid);
  const start = points[lo] ?? first;
  const end = points[hi] ?? start;
  if (start.date === end.date) {
    return start.date;
  }
  return shiftIsoDate(
    start.date,
    Math.round(daysBetween(start.date, end.date) / 2),
  );
}

function median(values: number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const mid = Math.floor(sorted.length / 2);
  const upper = sorted[mid];
  if (upper == null) {
    return 0;
  }
  if (sorted.length % 2 === 1) {
    return upper;
  }
  const lower = sorted[mid - 1] ?? upper;
  return (lower + upper) / 2;
}
