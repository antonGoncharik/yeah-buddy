import { isRecord, mapRecordList } from "@/lib/read";
import type {
  MuscleCell,
  MuscleExerciseHit,
  MuscleId,
  MuscleSnapshot,
  MuscleStatus,
} from "@/lib/types";
import { MUSCLE_IDS } from "@/lib/workout/muscle-taxonomy";
import { toNumber } from "@/lib/workout/numbers";

const MUSCLE_ID_SET = new Set<string>(MUSCLE_IDS);
const STATUS_SET = new Set<MuscleStatus>([
  "trained",
  "stale",
  "missed",
  "planned",
  "idle",
]);

export function parseMuscleSnapshot(data: unknown): MuscleSnapshot | null {
  if (!isRecord(data)) {
    return null;
  }

  const muscles = mapRecordList(data.muscles, parseMuscleCell).filter(
    (item): item is MuscleCell => item != null,
  );
  if (muscles.length === 0) {
    return null;
  }

  const hits_by_muscle: Partial<Record<MuscleId, MuscleExerciseHit[]>> = {};
  if (isRecord(data.hits_by_muscle)) {
    for (const [key, value] of Object.entries(data.hits_by_muscle)) {
      if (!MUSCLE_ID_SET.has(key) || !Array.isArray(value)) {
        continue;
      }
      const hits = value
        .map(parseMuscleHit)
        .filter((item): item is MuscleExerciseHit => item != null);
      if (hits.length > 0) {
        hits_by_muscle[key as MuscleId] = hits;
      }
    }
  }

  return {
    horizon_days: toNumber(data.horizon_days),
    since: String(data.since ?? ""),
    until: String(data.until ?? ""),
    muscles,
    hits_by_muscle,
    planned_template_name:
      typeof data.planned_template_name === "string"
        ? data.planned_template_name
        : null,
    completed_sessions: toNumber(data.completed_sessions),
    skipped_sessions: toNumber(data.skipped_sessions),
  };
}

function parseMuscleCell(value: unknown): MuscleCell | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }
  if (!MUSCLE_ID_SET.has(value.id)) {
    return null;
  }
  const status = value.status;
  if (typeof status !== "string" || !STATUS_SET.has(status as MuscleStatus)) {
    return null;
  }
  const view = value.view === "back" ? "back" : "front";

  return {
    id: value.id as MuscleId,
    label: String(value.label ?? ""),
    view,
    load: toNumber(value.load),
    status: status as MuscleStatus,
    last_trained:
      typeof value.last_trained === "string" ? value.last_trained : null,
    work_sets: toNumber(value.work_sets),
    missed_sessions: toNumber(value.missed_sessions),
  };
}

function parseMuscleHit(value: unknown): MuscleExerciseHit | null {
  if (!isRecord(value) || typeof value.exercise_id !== "string") {
    return null;
  }
  return {
    exercise_id: value.exercise_id,
    name: String(value.name ?? ""),
    last_date: String(value.last_date ?? ""),
    tonnage: toNumber(value.tonnage),
  };
}
