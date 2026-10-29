import type { Exercise } from "@/lib/types";
import { parseDecimal } from "@/lib/workout/numbers";

export type MissingTrackEntry = {
  exercise_id: string;
  start_weight: number;
};

export function buildMissingTrackEntries(
  exercises: Exercise[],
  values: Record<string, string>,
): MissingTrackEntry[] {
  return exercises.flatMap((exercise) => {
    const weight = parseDecimal(values[exercise.id] ?? "");
    return weight != null && weight > 0
      ? [{ exercise_id: exercise.id, start_weight: weight }]
      : [];
  });
}
