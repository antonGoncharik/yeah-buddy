import { isRecord, mapRecordList } from "@/lib/read";
import type { SessionDetail, SessionExerciseDetail } from "@/lib/types";
import {
  mapExercise,
  mapSessionExercise,
  mapWorkoutSet,
  parseExerciseWithMax,
  parseWorkoutPhase,
  parseWorkoutSession,
  parseWorkoutTemplate,
} from "@/lib/workout/map-rows";

export function readExercises(data: unknown) {
  if (!isRecord(data)) {
    return [];
  }

  return mapRecordList(data.exercises, (row) => parseExerciseWithMax(row));
}

export function readSessionDetail(data: unknown): SessionDetail | null {
  if (!isRecord(data)) {
    return null;
  }

  const session = parseWorkoutSession(data.session);
  if (!session) {
    return null;
  }

  return {
    session,
    template: parseWorkoutTemplate(data.template),
    phase: parseWorkoutPhase(data.phase),
    exercises: mapRecordList(data.exercises, parseSessionExerciseDetail),
  };
}

function parseSessionExerciseDetail(
  row: Record<string, unknown>,
): SessionExerciseDetail | null {
  if (typeof row.id !== "string" || !isRecord(row.exercise)) {
    return null;
  }

  return {
    ...mapSessionExercise(row),
    exercise: mapExercise(row.exercise),
    sets: mapRecordList(row.sets, (set) =>
      typeof set.id === "string" ? mapWorkoutSet(set) : null,
    ),
  };
}
