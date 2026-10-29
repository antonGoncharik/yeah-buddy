import { isRecord } from "@/lib/read";
import type { ExerciseWithMax } from "@/lib/types";
import { parseExerciseWithMax } from "@/lib/workout/map-exercise";

export function readExerciseWithMaxFromApi(
  data: unknown,
): ExerciseWithMax | null {
  return parseExerciseWithMax(isRecord(data) ? data.exercise : null);
}
