import { isRecord, mapRecordList } from "@/lib/read";
import type {
  SessionDetail,
  SessionExerciseDetail,
  WorkoutPhase,
  WorkoutTemplate,
} from "@/lib/types";
import {
  mapExercise,
  mapSessionExercise,
  mapWorkoutSet,
  parseExerciseWithMax,
  parseWorkoutSession,
} from "@/lib/workout/map-rows";
import { toNumber } from "@/lib/workout/numbers";

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
    template: parseTemplate(data.template),
    phase: parsePhase(data.phase),
    exercises: mapRecordList(data.exercises, parseSessionExerciseDetail),
  };
}

function parseTemplate(value: unknown): WorkoutTemplate | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }

  return {
    id: value.id,
    user_id: String(value.user_id ?? ""),
    name: String(value.name ?? ""),
    kind: value.kind === "static" ? "static" : "dynamic",
    sort_order: toNumber(value.sort_order),
    is_active: Boolean(value.is_active),
    created_at: String(value.created_at ?? ""),
    updated_at: String(value.updated_at ?? ""),
  };
}

function parsePhase(value: unknown): WorkoutPhase | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }

  const phaseType = value.phase_type;
  if (
    phaseType !== "ramp" &&
    phaseType !== "volume" &&
    phaseType !== "peak" &&
    phaseType !== "deload"
  ) {
    return null;
  }

  return {
    id: value.id,
    user_id: String(value.user_id ?? ""),
    macro_cycle_id: String(value.macro_cycle_id ?? ""),
    phase_type: phaseType,
    start_date: String(value.start_date ?? ""),
    end_date: typeof value.end_date === "string" ? value.end_date : null,
    status: value.status === "completed" ? "completed" : "current",
    sort_order: toNumber(value.sort_order),
    created_at: String(value.created_at ?? ""),
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
