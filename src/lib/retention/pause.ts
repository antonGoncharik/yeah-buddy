import { shiftIsoDate } from "@/lib/day/dates";
import { floorToStep } from "@/lib/workout/formulas";

export const PAUSE_DAY_CHOICES = [3, 7, 14] as const;

export type PauseDays = (typeof PAUSE_DAY_CHOICES)[number];

export function isPauseDays(value: number): value is PauseDays {
  return value === 3 || value === 7 || value === 14;
}

export function pauseUntilDate(today: string, days: PauseDays): string {
  return shiftIsoDate(today, days - 1);
}

export function pauseCovers(
  date: string,
  from: string | null,
  until: string | null,
): boolean {
  if (from == null || until == null) {
    return false;
  }
  return date >= from && date <= until;
}

export function pauseReturnDue(
  today: string,
  until: string | null,
  pending: boolean,
): boolean {
  return pending && until != null && today > until;
}

/** About ten percent off, still on the plate step. One step down if ten percent doesn't move. */
export function lighterPlannedWeight(weight: number, step: number): number {
  if (!(weight > 0)) {
    return weight;
  }
  const scaled = weight * 0.9;
  const next =
    step > 0 ? floorToStep(scaled, step) : Math.round(scaled * 10) / 10;
  if (next > 0 && next < weight) {
    return next;
  }
  if (!(step > 0)) {
    return weight;
  }
  const down = floorToStep(weight - step, step);
  return down > 0 && down < weight ? down : weight;
}
