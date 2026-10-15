import type { SessionFeel } from "@/lib/types";
import { floorToStep } from "@/lib/workout/formulas";

export type TrackProgressOutcome = "up" | "hold" | "maintain";

export interface TrackProgressSet {
  set_type: string;
  planned_weight: number | null;
  actual_weight: number | null;
  planned_reps: number | null;
  actual_reps: number | null;
  planned_reps_to: number | null;
}

export function trackProgressFromWorkSets(input: {
  feel: SessionFeel | null;
  sets: readonly TrackProgressSet[];
}): TrackProgressOutcome {
  if (input.feel === "miss") {
    return "hold";
  }
  if (input.feel == null) {
    return "maintain";
  }

  const workSets = input.sets.filter((set) => set.set_type === "work");
  if (workSets.length === 0) {
    return "hold";
  }

  let inRepRangePlateau = false;

  for (const set of workSets) {
    const floor = set.planned_reps;
    const top = set.planned_reps_to ?? set.planned_reps;
    const actualReps = set.actual_reps ?? set.planned_reps;

    if (floor != null && floor > 0) {
      if (actualReps == null || actualReps < floor) {
        return "hold";
      }
    }

    if (top == null || top <= 0) {
      continue;
    }

    if (actualReps == null || actualReps < top) {
      if (
        set.planned_reps_to != null &&
        floor != null &&
        actualReps != null &&
        actualReps >= floor
      ) {
        inRepRangePlateau = true;
      } else {
        return "hold";
      }
    }

    const plannedWeight = set.planned_weight;
    const actualWeight = set.actual_weight ?? set.planned_weight;
    if (
      plannedWeight != null &&
      plannedWeight > 0 &&
      (actualWeight == null || actualWeight < plannedWeight)
    ) {
      return "hold";
    }
  }

  return inRepRangePlateau ? "maintain" : "up";
}

export function peakWorkWeight(
  sets: readonly TrackProgressSet[],
): number | null {
  let best: number | null = null;
  for (const set of sets) {
    if (set.set_type !== "work") {
      continue;
    }
    const weight = set.actual_weight ?? set.planned_weight;
    if (weight == null || weight <= 0) {
      continue;
    }
    if (best == null || weight > best) {
      best = weight;
    }
  }
  return best;
}

const HOLD_STREAK = 3;

/** Three holds in a row at the same working weight → ease. */
export function shouldEaseTrackAfterHolds(input: {
  outcomes: readonly TrackProgressOutcome[];
  workingWeights: readonly (number | null)[];
}): boolean {
  if (input.outcomes.length < HOLD_STREAK) {
    return false;
  }
  const tailOutcomes = input.outcomes.slice(-HOLD_STREAK);
  if (!tailOutcomes.every((item) => item === "hold")) {
    return false;
  }
  const tailWeights = input.workingWeights.slice(-HOLD_STREAK);
  const anchor = tailWeights[0];
  if (anchor == null || !(anchor > 0)) {
    return false;
  }
  return tailWeights.every((weight) => weight != null && weight === anchor);
}

export function easedWeightTenPercent(
  current: number,
  step: number,
): number | null {
  if (!(current > 0) || !(step > 0)) {
    return null;
  }
  const next = floorToStep(current * 0.9, step);
  if (!(next > 0) || next >= current) {
    return null;
  }
  return next;
}
