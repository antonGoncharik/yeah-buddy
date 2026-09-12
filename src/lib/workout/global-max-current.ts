import { isIsoDate } from "@/lib/day/dates";
import type { Exercise, ExerciseWithMax, GlobalMax } from "@/lib/types";

export function attachMaxes(
  exercise: Exercise,
  maxes: Map<string, GlobalMax[]>,
): ExerciseWithMax {
  const history = maxes.get(exercise.id) ?? [];
  return {
    ...exercise,
    current_max: pickCurrentMax(history),
    max_history: history,
  };
}

export function resolveAchievedAt(
  value: string | undefined,
  today: string,
): string {
  if (value && isIsoDate(value)) {
    return value;
  }

  return today;
}

export function pickCurrentMax(history: GlobalMax[]): GlobalMax | null {
  if (history.length === 0) {
    return null;
  }

  return history.reduce((best, record) => {
    if (record.max_weight > best.max_weight) {
      return record;
    }

    if (record.max_weight === best.max_weight) {
      if (record.achieved_at > best.achieved_at) {
        return record;
      }

      if (
        record.achieved_at === best.achieved_at &&
        record.created_at > best.created_at
      ) {
        return record;
      }
    }

    return best;
  });
}
