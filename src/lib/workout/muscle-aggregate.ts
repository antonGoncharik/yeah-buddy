import type {
  MuscleCell,
  MuscleExerciseHit,
  MuscleId,
  MuscleMissedEvent,
  MuscleSnapshot,
} from "@/lib/types";
import { buildMuscleBalance, buildMuscleInsights } from "@/lib/workout/muscle-insights";
import { resolveExerciseMuscleWeights } from "@/lib/workout/muscle-resolve";
import {
  MUSCLE_IDS,
  MUSCLE_LABELS,
  MUSCLE_VIEW,
} from "@/lib/workout/muscle-taxonomy";
import {
  setsPerWeek,
  volumeBandFromWeeklySets,
  weekCount,
  weekIndexFromSince,
} from "@/lib/workout/muscle-volume";
import { workTonnage } from "@/lib/workout/session-tonnage";

export interface ExerciseMuscleMeta {
  exercise_id: string;
  name: string;
  body_part: string | null;
  name_en: string | null;
  name_ru: string | null;
  equipment: string | null;
  source_exercise_id: string | null;
  target: string | null;
  secondary_muscles: string[] | null;
}

export interface MuscleSessionWork {
  session_id: string;
  session_date: string;
  status: "completed" | "skipped";
  template_id: string | null;
  template_name: string | null;
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

export function buildMuscleSnapshot(
  input: MuscleAggregateInput,
): MuscleSnapshot {
  const weeks = weekCount(input.horizon_days);
  const weightedSets = emptyMuscleMap();
  const weeklySets = initWeeklyBuckets(weeks);
  const lastTrained = new Map<MuscleId, string>();
  const missedCount = emptyMuscleMap();
  const missedEvents: MuscleMissedEvent[] = [];
  const hits = new Map<MuscleId, Map<string, MuscleExerciseHit>>();
  let unmappedExerciseCount = 0;
  let completedSessions = 0;
  let skippedSessions = 0;

  const plannedMuscles = musclesForExerciseIds(
    input.planned_exercise_ids,
    input.metaByExercise,
  );

  for (const session of input.sessions) {
    if (session.status === "skipped") {
      skippedSessions += 1;
      const exerciseIds =
        session.template_id != null
          ? (input.templateExerciseIds.get(session.template_id) ?? [])
          : session.exercises.map((item) => item.exercise_id);
      const musclesHit = new Set<MuscleId>();
      for (const exerciseId of exerciseIds) {
        const meta = input.metaByExercise.get(exerciseId);
        if (!meta) {
          continue;
        }
        const weights = musclesForMeta(meta);
        if (Object.keys(weights).length === 0) {
          continue;
        }
        for (const muscleId of Object.keys(weights) as MuscleId[]) {
          missedCount[muscleId] += 1;
          musclesHit.add(muscleId);
        }
      }
      if (musclesHit.size > 0) {
        missedEvents.push({
          date: session.session_date,
          template_name: session.template_name,
          muscles: [...musclesHit],
        });
      }
      continue;
    }

    completedSessions += 1;
    const weekIndex = weekIndexFromSince(input.since, session.session_date);

    for (const row of session.exercises) {
      const meta = input.metaByExercise.get(row.exercise_id);
      if (!meta) {
        continue;
      }
      const weights = musclesForMeta(meta);
      if (Object.keys(weights).length === 0) {
        unmappedExerciseCount += 1;
        continue;
      }
      const setCount = countWorkSets(row.sets);
      if (setCount === 0) {
        continue;
      }
      const tonnage = workTonnage(row.sets) ?? 0;

      for (const [muscleId, weight] of Object.entries(weights) as Array<
        [MuscleId, number]
      >) {
        if (weight <= 0) {
          continue;
        }
        const contribution = setCount * weight;
        weightedSets[muscleId] += contribution;
        if (weekIndex >= 0 && weekIndex < weeks) {
          weeklySets[muscleId][weekIndex] += contribution;
        }
        const prev = lastTrained.get(muscleId);
        if (!prev || session.session_date > prev) {
          lastTrained.set(muscleId, session.session_date);
        }
        recordHit(hits, muscleId, meta, session.session_date, setCount, tonnage);
      }
    }
  }

  const muscles: MuscleCell[] = MUSCLE_IDS.map((id) => {
    const sets = Math.round(weightedSets[id] * 10) / 10;
    const perWeek = setsPerWeek(sets, input.horizon_days);
    const band = volumeBandFromWeeklySets(perWeek);
    const last = lastTrained.get(id) ?? null;
    const daysSince = daysBetween(last, input.today);

    return {
      id,
      label: MUSCLE_LABELS[id],
      view: MUSCLE_VIEW[id],
      sets,
      sets_per_week: perWeek,
      volume_band: band,
      last_trained: last,
      days_since: daysSince,
      in_next_session: plannedMuscles.has(id),
      missed_sessions: missedCount[id],
      weekly_sets: weeklySets[id].map((value) => Math.round(value * 10) / 10),
    };
  });

  const hits_by_muscle: Partial<Record<MuscleId, MuscleExerciseHit[]>> = {};
  for (const id of MUSCLE_IDS) {
    const list = [...(hits.get(id)?.values() ?? [])].sort(
      (left, right) =>
        right.sets - left.sets || right.last_date.localeCompare(left.last_date),
    );
    if (list.length > 0) {
      hits_by_muscle[id] = list.slice(0, 6);
    }
  }

  const balance = buildMuscleBalance(muscles);
  const insights = buildMuscleInsights({
    muscles,
    missed: missedEvents,
    planned_template_name: input.planned_template_name,
  });

  return {
    horizon_days: input.horizon_days,
    since: input.since,
    until: input.until,
    muscles,
    hits_by_muscle,
    missed: missedEvents,
    balance,
    insights,
    planned_template_name: input.planned_template_name,
    completed_sessions: completedSessions,
    skipped_sessions: skippedSessions,
    unmapped_exercise_count: unmappedExerciseCount,
  };
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
  return resolveExerciseMuscleWeights(meta);
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
  sets: number,
  tonnage: number,
) {
  const byExercise = hits.get(muscleId) ?? new Map<string, MuscleExerciseHit>();
  const prev = byExercise.get(meta.exercise_id);
  const nextSets = (prev?.sets ?? 0) + sets;
  const nextTonnage = (prev?.tonnage ?? 0) + tonnage;
  const last_date =
    !prev || date >= prev.last_date ? date : prev.last_date;
  byExercise.set(meta.exercise_id, {
    exercise_id: meta.exercise_id,
    name: meta.name,
    last_date,
    sets: nextSets,
    tonnage: nextTonnage,
  });
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

function initWeeklyBuckets(weeks: number): Record<MuscleId, number[]> {
  const out = {} as Record<MuscleId, number[]>;
  for (const id of MUSCLE_IDS) {
    out[id] = Array.from({ length: weeks }, () => 0);
  }
  return out;
}

export function parseMuscleHorizonDays(value: string | null): number {
  const parsed = Number(value);
  if (parsed === 7 || parsed === 14 || parsed === 30 || parsed === 90) {
    return parsed;
  }
  return 14;
}
