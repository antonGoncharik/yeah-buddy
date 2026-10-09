import type {
  MuscleCell,
  MuscleExerciseHit,
  MuscleId,
  MuscleSnapshot,
  MuscleStatus,
} from "@/lib/types";
import {
  MUSCLE_IDS,
  MUSCLE_LABELS,
  MUSCLE_VIEW,
  resolveExerciseMuscles,
} from "@/lib/workout/muscle-taxonomy";
import { workTonnage } from "@/lib/workout/session-tonnage";

export interface ExerciseMuscleMeta {
  exercise_id: string;
  name: string;
  body_part: string | null;
  name_en: string | null;
  name_ru: string | null;
  equipment: string | null;
}

export interface MuscleSessionWork {
  session_id: string;
  session_date: string;
  status: "completed" | "skipped";
  template_id: string | null;
  exercises: Array<{
    exercise_id: string;
    sets: Array<{
      set_type?: string;
      actual_weight: number | null;
      planned_weight: number | null;
      actual_reps: number | null;
      planned_reps: number | null;
    }>;
  }>;
}

export interface MuscleAggregateInput {
  horizon_days: number;
  since: string;
  until: string;
  today: string;
  metaByExercise: Map<string, ExerciseMuscleMeta>;
  sessions: MuscleSessionWork[];
  templateExerciseIds: Map<string, string[]>;
  planned_template_name: string | null;
  planned_exercise_ids: string[];
}

const STALE_AFTER_DAYS = 10;

export function buildMuscleSnapshot(
  input: MuscleAggregateInput,
): MuscleSnapshot {
  const rawLoad = emptyMuscleMap();
  const workSets = emptyMuscleMap();
  const lastTrained = new Map<MuscleId, string>();
  const missedCount = emptyMuscleMap();
  const hits = new Map<MuscleId, Map<string, MuscleExerciseHit>>();

  let completedSessions = 0;
  let skippedSessions = 0;

  for (const session of input.sessions) {
    if (session.status === "skipped") {
      skippedSessions += 1;
      const exerciseIds =
        session.template_id != null
          ? (input.templateExerciseIds.get(session.template_id) ?? [])
          : session.exercises.map((item) => item.exercise_id);
      for (const exerciseId of exerciseIds) {
        const meta = input.metaByExercise.get(exerciseId);
        if (!meta) {
          continue;
        }
        const weights = musclesForMeta(meta);
        for (const muscleId of Object.keys(weights) as MuscleId[]) {
          missedCount[muscleId] += 1;
        }
      }
      continue;
    }

    completedSessions += 1;
    for (const row of session.exercises) {
      const meta = input.metaByExercise.get(row.exercise_id);
      if (!meta) {
        continue;
      }
      const tonnage = workTonnage(row.sets);
      const weights = musclesForMeta(meta);
      const setCount = countWorkSets(row.sets);
      if (tonnage == null && setCount === 0) {
        continue;
      }

      const effectiveTonnage = tonnage ?? setCount * 1;
      for (const [muscleId, weight] of Object.entries(weights) as Array<
        [MuscleId, number]
      >) {
        if (weight <= 0) {
          continue;
        }
        rawLoad[muscleId] += effectiveTonnage * weight;
        workSets[muscleId] += setCount * weight;
        const prev = lastTrained.get(muscleId);
        if (!prev || session.session_date > prev) {
          lastTrained.set(muscleId, session.session_date);
        }
        recordHit(hits, muscleId, meta, session.session_date, effectiveTonnage);
      }
    }
  }

  const plannedMuscles = musclesForExerciseIds(
    input.planned_exercise_ids,
    input.metaByExercise,
  );

  const maxLoad = Math.max(...MUSCLE_IDS.map((id) => rawLoad[id]), 0);
  const muscles: MuscleCell[] = MUSCLE_IDS.map((id) => {
    const load = maxLoad > 0 ? rawLoad[id] / maxLoad : 0;
    const status = muscleStatus({
      id,
      load,
      rawLoad: rawLoad[id],
      lastTrained: lastTrained.get(id) ?? null,
      missed: missedCount[id],
      planned: plannedMuscles.has(id),
      today: input.today,
      since: input.since,
    });
    return {
      id,
      label: MUSCLE_LABELS[id],
      view: MUSCLE_VIEW[id],
      load: roundLoad(load),
      status,
      last_trained: lastTrained.get(id) ?? null,
      work_sets: Math.round(workSets[id]),
      missed_sessions: missedCount[id],
    };
  });

  const hits_by_muscle: Partial<Record<MuscleId, MuscleExerciseHit[]>> = {};
  for (const id of MUSCLE_IDS) {
    const list = [...(hits.get(id)?.values() ?? [])].sort(
      (left, right) =>
        right.tonnage - left.tonnage ||
        right.last_date.localeCompare(left.last_date),
    );
    if (list.length > 0) {
      hits_by_muscle[id] = list.slice(0, 6);
    }
  }

  return {
    horizon_days: input.horizon_days,
    since: input.since,
    until: input.until,
    muscles,
    hits_by_muscle,
    planned_template_name: input.planned_template_name,
    completed_sessions: completedSessions,
    skipped_sessions: skippedSessions,
  };
}

function muscleStatus(input: {
  id: MuscleId;
  load: number;
  rawLoad: number;
  lastTrained: string | null;
  missed: number;
  planned: boolean;
  today: string;
  since: string;
}): MuscleStatus {
  if (input.missed > 0 && input.rawLoad <= 0) {
    return "missed";
  }
  if (input.missed > 0 && input.load < 0.35) {
    return "missed";
  }
  if (input.planned && input.load < 0.2) {
    return "planned";
  }
  if (input.rawLoad <= 0) {
    return "idle";
  }
  const daysSince = daysBetween(input.lastTrained, input.today);
  if (daysSince != null && daysSince > STALE_AFTER_DAYS) {
    return "stale";
  }
  if (input.load >= 0.12) {
    return "trained";
  }
  if (input.rawLoad > 0) {
    return "stale";
  }
  return "idle";
}

function daysBetween(from: string | null, to: string): number | null {
  if (!from) {
    return null;
  }
  const start = Date.parse(`${from}T12:00:00Z`);
  const end = Date.parse(`${to}T12:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return null;
  }
  return Math.round((end - start) / 86_400_000);
}

function musclesForMeta(
  meta: ExerciseMuscleMeta,
): Partial<Record<MuscleId, number>> {
  return resolveExerciseMuscles({
    body_part: meta.body_part,
    name_en: meta.name_en,
    name_ru: meta.name_ru,
    equipment: meta.equipment,
  });
}

function musclesForExerciseIds(
  ids: string[],
  metaByExercise: Map<string, ExerciseMuscleMeta>,
): Set<MuscleId> {
  const out = new Set<MuscleId>();
  for (const id of ids) {
    const meta = metaByExercise.get(id);
    if (!meta) {
      continue;
    }
    for (const muscleId of Object.keys(musclesForMeta(meta)) as MuscleId[]) {
      out.add(muscleId);
    }
  }
  return out;
}

function recordHit(
  hits: Map<MuscleId, Map<string, MuscleExerciseHit>>,
  muscleId: MuscleId,
  meta: ExerciseMuscleMeta,
  date: string,
  tonnage: number,
) {
  const byExercise = hits.get(muscleId) ?? new Map<string, MuscleExerciseHit>();
  const prev = byExercise.get(meta.exercise_id);
  if (!prev || date >= prev.last_date) {
    byExercise.set(meta.exercise_id, {
      exercise_id: meta.exercise_id,
      name: meta.name,
      last_date: date,
      tonnage: (prev?.tonnage ?? 0) + tonnage,
    });
  } else if (prev) {
    byExercise.set(meta.exercise_id, {
      ...prev,
      tonnage: prev.tonnage + tonnage,
    });
  }
  hits.set(muscleId, byExercise);
}

function countWorkSets(sets: Array<{ set_type?: string }>): number {
  let count = 0;
  for (const set of sets) {
    if (set.set_type != null && set.set_type !== "work") {
      continue;
    }
    count += 1;
  }
  return count;
}

function emptyMuscleMap(): Record<MuscleId, number> {
  const out = {} as Record<MuscleId, number>;
  for (const id of MUSCLE_IDS) {
    out[id] = 0;
  }
  return out;
}

function roundLoad(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function parseMuscleHorizonDays(value: string | null): number {
  const parsed = Number(value);
  if (parsed === 7 || parsed === 14 || parsed === 30 || parsed === 90) {
    return parsed;
  }
  return 14;
}
