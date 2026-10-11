import { isRecord, mapRecordList } from "@/lib/read";
import type {
  MuscleBalancePair,
  MuscleCell,
  MuscleExerciseHit,
  MuscleId,
  MuscleMissedEvent,
  MuscleSnapshot,
  VolumeBand,
} from "@/lib/types";
import { MUSCLE_IDS } from "@/lib/workout/muscle-taxonomy";
import { toNumber } from "@/lib/workout/numbers";

const MUSCLE_ID_SET = new Set<string>(MUSCLE_IDS);
const BAND_SET = new Set<VolumeBand>([0, 1, 2, 3, 4]);

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
    missed: mapRecordList(data.missed, parseMissed).filter(
      (item): item is MuscleMissedEvent => item != null,
    ),
    balance: mapRecordList(data.balance, parseBalance).filter(
      (item): item is MuscleBalancePair => item != null,
    ),
    insights: parseInsights(data.insights),
    planned_template_name:
      typeof data.planned_template_name === "string"
        ? data.planned_template_name
        : null,
    completed_sessions: toNumber(data.completed_sessions),
    skipped_sessions: toNumber(data.skipped_sessions),
    unmapped_exercise_count: toNumber(data.unmapped_exercise_count),
  };
}

function parseMuscleCell(value: unknown): MuscleCell | null {
  if (!isRecord(value) || typeof value.id !== "string") {
    return null;
  }
  if (!MUSCLE_ID_SET.has(value.id)) {
    return null;
  }
  const band = toNumber(value.volume_band);
  if (!BAND_SET.has(band as VolumeBand)) {
    return null;
  }
  const view = value.view === "back" ? "back" : "front";
  const weekly = Array.isArray(value.weekly_sets)
    ? value.weekly_sets.map((item) => toNumber(item))
    : [];

  return {
    id: value.id as MuscleId,
    label: String(value.label ?? ""),
    view,
    sets: toNumber(value.sets),
    sets_per_week: toNumber(value.sets_per_week),
    volume_band: band as VolumeBand,
    last_trained:
      typeof value.last_trained === "string" ? value.last_trained : null,
    days_since: value.days_since == null ? null : toNumber(value.days_since),
    in_next_session: value.in_next_session === true,
    missed_sessions: toNumber(value.missed_sessions),
    weekly_sets: weekly,
    recovery_percent:
      value.recovery_percent == null ? null : toNumber(value.recovery_percent),
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
    sets: toNumber(value.sets),
    tonnage: toNumber(value.tonnage),
  };
}

function parseMissed(value: unknown): MuscleMissedEvent | null {
  if (!isRecord(value) || typeof value.date !== "string") {
    return null;
  }
  const muscles = Array.isArray(value.muscles)
    ? value.muscles.filter(
        (item): item is MuscleId =>
          typeof item === "string" && MUSCLE_ID_SET.has(item),
      )
    : [];
  return {
    date: value.date,
    template_name:
      typeof value.template_name === "string" ? value.template_name : null,
    muscles,
  };
}

function parseBalance(value: unknown): MuscleBalancePair | null {
  if (!isRecord(value)) {
    return null;
  }
  if (
    typeof value.a !== "string" ||
    typeof value.b !== "string" ||
    !MUSCLE_ID_SET.has(value.a) ||
    !MUSCLE_ID_SET.has(value.b)
  ) {
    return null;
  }
  return {
    a: value.a as MuscleId,
    b: value.b as MuscleId,
    ratio: toNumber(value.ratio),
    label: String(value.label ?? ""),
  };
}

function parseInsights(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
