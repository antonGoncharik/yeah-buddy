import { isRecord, mapRecordList } from "@/lib/read";
import type {
  SessionDetail,
  SessionExerciseDetail,
  SessionMaxRaiseOffer,
  SessionPreviousWork,
} from "@/lib/types";
import { toSessionFeel } from "@/lib/workout/map-enums";
import {
  mapExercise,
  mapSessionExercise,
  mapWorkoutSet,
  parseWorkoutPhase,
  parseWorkoutSession,
  parseWorkoutTemplate,
} from "@/lib/workout/map-rows";
import { toNullableNumber, toNumber } from "@/lib/workout/numbers";

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
    raise_offers: mapRecordList(data.raise_offers, parseRaiseOffer),
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
    previous: parsePreviousWork(row.previous),
  };
}

function parsePreviousWork(value: unknown): SessionPreviousWork | null {
  if (!isRecord(value)) {
    return null;
  }

  const feel = toSessionFeel(value.feel);
  const weight = toNullableNumber(value.weight);
  const reps = toNullableNumber(value.reps);
  const seconds = toNullableNumber(value.seconds);
  if ((weight == null || weight <= 0) && feel == null) {
    return null;
  }

  return {
    weight: weight != null && weight > 0 ? weight : null,
    reps: reps != null && reps > 0 ? reps : null,
    seconds: seconds != null && seconds > 0 ? seconds : null,
    feel,
  };
}

function parseRaiseOffer(
  row: Record<string, unknown>,
): SessionMaxRaiseOffer | null {
  if (typeof row.exercise_id !== "string" || typeof row.name !== "string") {
    return null;
  }

  const from_weight = toNumber(row.from_weight);
  const to_weight = toNumber(row.to_weight);
  if (from_weight <= 0 || to_weight <= 0) {
    return null;
  }

  return {
    exercise_id: row.exercise_id,
    name: row.name,
    from_weight,
    to_weight,
  };
}
