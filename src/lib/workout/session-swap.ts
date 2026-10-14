import type { MuscleId } from "@/lib/types";
import { MUSCLE_IDS } from "@/lib/workout/muscle-taxonomy";
import { formatSeconds, formatWeight } from "@/lib/workout/numbers";
import type { PlannedSetRow } from "@/lib/workout/slot-plan";

const PRIMARY_MIN = 0.25;

export function primaryMuscle(
  weights: Partial<Record<MuscleId, number>>,
): MuscleId | null {
  let best: MuscleId | null = null;
  let score = 0;
  for (const id of MUSCLE_IDS) {
    const value = weights[id] ?? 0;
    if (value > score) {
      score = value;
      best = id;
    }
  }
  return score >= PRIMARY_MIN ? best : null;
}

export function rankSwapOptions<
  T extends { id: string; name: string; workoutType: string },
>(input: {
  currentId: string;
  currentType: string;
  takenIds: readonly string[];
  options: readonly T[];
  limit?: number;
}): T[] {
  const taken = new Set(input.takenIds);
  const limit = input.limit ?? 5;
  return input.options
    .filter((item) => item.id !== input.currentId && !taken.has(item.id))
    .sort((left, right) => {
      const leftType = left.workoutType === input.currentType ? 0 : 1;
      const rightType = right.workoutType === input.currentType ? 0 : 1;
      if (leftType !== rightType) {
        return leftType - rightType;
      }
      return left.name.localeCompare(right.name, "ru");
    })
    .slice(0, limit);
}

/** One line for the swap sheet: working sets and the weight the plan would use. */
export function swapPlanLine(sets: readonly PlannedSetRow[]): string | null {
  const work = sets.filter((set) => set.set_type === "work");
  const first = work[0];
  if (!first) {
    return null;
  }
  if (first.planned_seconds != null && first.planned_reps == null) {
    return `${work.length}×${formatSeconds(first.planned_seconds)} с`;
  }
  const reps =
    first.planned_reps != null && first.planned_reps_to != null
      ? `${first.planned_reps}–${first.planned_reps_to}`
      : first.planned_reps != null
        ? String(first.planned_reps)
        : null;
  const count = reps ? `${work.length}×${reps}` : `${work.length} подхода`;
  if (first.planned_weight != null && first.planned_weight > 0) {
    return `${count} · ${formatWeight(first.planned_weight)} кг`;
  }
  return `${count} · по самочувствию`;
}

/** Replace the whole line, keep finished sets and swap the rest, or refuse. */
export function swapMode(
  sets: readonly { is_completed: boolean; set_type: string }[],
): "replace" | "continue" | "blocked" {
  if (!sets.some((set) => set.is_completed)) {
    return "replace";
  }
  const openWork = sets.some(
    (set) => !set.is_completed && set.set_type === "work",
  );
  return openWork ? "continue" : "blocked";
}
