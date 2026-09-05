import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Exercise,
  SessionDetail,
  SessionExercise,
  WorkoutFormulas,
  WorkoutPhase,
  WorkoutSession,
  WorkoutSet,
} from "@/lib/types";
import {
  getExercise,
  listExercises,
  mapExercise,
} from "@/lib/workout/exercises";
import {
  plannedSetsFromFormula,
  resolvePhaseSpec,
} from "@/lib/workout/formulas";
import { listCurrentPhaseMaxes, mapWorkoutPhase } from "@/lib/workout/macros";
import { toNullableNumber, toNumber } from "@/lib/workout/numbers";
import { getSession, patchSession } from "@/lib/workout/sessions";
import {
  clearSkipTemplateIds,
  ensureWorkoutSettings,
} from "@/lib/workout/settings";
import { getTemplate } from "@/lib/workout/templates";

export const addSessionExerciseSchema = z.object({
  exercise_id: z.string().uuid(),
});

export const patchSetSchema = z.object({
  actual_weight: z.number().finite().positive().nullable().optional(),
  actual_reps: z.number().int().positive().nullable().optional(),
  actual_seconds: z.number().finite().positive().nullable().optional(),
  is_completed: z.boolean().optional(),
});

export const completeSessionSchema = z.object({
  sets: z
    .array(
      z.object({
        id: z.string().uuid(),
        actual_weight: z.number().finite().positive().nullable().optional(),
        actual_reps: z.number().int().positive().nullable().optional(),
        actual_seconds: z.number().finite().positive().nullable().optional(),
      }),
    )
    .optional(),
});

export type PatchSetInput = z.infer<typeof patchSetSchema>;
export type CompleteSessionInput = z.infer<typeof completeSessionSchema>;

export async function getSessionDetail(
  userId: string,
  sessionId: string,
): Promise<SessionDetail | null> {
  const session = await getSession(userId, sessionId);
  if (!session) {
    return null;
  }

  await ensureSessionPlan(userId, session);
  return loadSessionDetail(userId, session);
}

export async function addExerciseToSession(
  userId: string,
  sessionId: string,
  exerciseId: string,
): Promise<SessionDetail | null> {
  const session = await getSession(userId, sessionId);
  if (!session) {
    return null;
  }

  const exercise = await getOwnedExercise(userId, exerciseId);
  if (!exercise?.is_active) {
    throw new Error("Упражнение не найдено.");
  }

  if (
    exercise.workout_type !== "both" &&
    exercise.workout_type !== session.workout_type
  ) {
    throw new Error("Это упражнение не подходит к типу тренировки.");
  }

  const detail = await loadSessionDetail(userId, session);
  if (detail.exercises.some((item) => item.exercise_id === exerciseId)) {
    return detail;
  }

  const maxWeight = await resolveExerciseMax(userId, session, exerciseId);
  const sortOrder =
    detail.exercises.reduce((max, item) => Math.max(max, item.sort_order), 0) +
    10;
  const settings = await ensureWorkoutSettings(userId);

  await insertSessionExercise(
    userId,
    session,
    exercise,
    maxWeight,
    sortOrder,
    settings.formulas,
  );
  return loadSessionDetail(userId, session);
}

export async function removeSessionExercise(
  userId: string,
  sessionId: string,
  sessionExerciseId: string,
): Promise<SessionDetail | null> {
  const session = await getSession(userId, sessionId);
  if (!session) {
    return null;
  }

  const detail = await loadSessionDetail(userId, session);
  const target = detail.exercises.find((item) => item.id === sessionExerciseId);
  if (!target) {
    throw new Error("Упражнение не найдено в тренировке.");
  }

  if (target.sets.some((set) => set.is_completed)) {
    throw new Error("Нельзя убрать упражнение с выполненными подходами.");
  }

  const supabase = createSupabaseServerClient();
  const deleted = await supabase
    .from("session_exercises")
    .delete()
    .eq("user_id", userId)
    .eq("id", sessionExerciseId)
    .eq("session_id", sessionId);

  if (deleted.error) {
    throw deleted.error;
  }

  return loadSessionDetail(userId, session);
}

export async function patchWorkoutSet(
  userId: string,
  setId: string,
  input: PatchSetInput,
): Promise<SessionDetail | null> {
  const supabase = createSupabaseServerClient();
  const existing = await supabase
    .from("workout_sets")
    .select("*")
    .eq("user_id", userId)
    .eq("id", setId)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (!existing.data) {
    return null;
  }

  const current = mapWorkoutSet(existing.data as Record<string, unknown>);
  const next = {
    actual_weight:
      input.actual_weight === undefined
        ? current.actual_weight
        : input.actual_weight,
    actual_reps:
      input.actual_reps === undefined ? current.actual_reps : input.actual_reps,
    actual_seconds:
      input.actual_seconds === undefined
        ? current.actual_seconds
        : input.actual_seconds,
    is_completed:
      input.is_completed === undefined
        ? current.is_completed
        : input.is_completed,
  };

  if (next.is_completed) {
    next.actual_weight = next.actual_weight ?? current.planned_weight;
    next.actual_reps = next.actual_reps ?? current.planned_reps;
    next.actual_seconds = next.actual_seconds ?? current.planned_seconds;

    if (next.actual_weight == null || next.actual_weight <= 0) {
      throw new Error("Укажите фактический вес.");
    }
  }

  const updated = await supabase
    .from("workout_sets")
    .update(next)
    .eq("user_id", userId)
    .eq("id", setId)
    .select("*")
    .single();

  if (updated.error || !updated.data) {
    throw updated.error ?? new Error("Set update failed");
  }

  const sessionExercise = await supabase
    .from("session_exercises")
    .select("*")
    .eq("id", current.session_exercise_id)
    .eq("user_id", userId)
    .single();

  if (sessionExercise.error || !sessionExercise.data) {
    throw sessionExercise.error ?? new Error("Session exercise lookup failed");
  }

  const sessionId = String(sessionExercise.data.session_id);
  const session = await getSession(userId, sessionId);
  if (!session) {
    return null;
  }

  if (next.is_completed && next.actual_weight != null) {
    if (session.status === "planned") {
      await patchSession(userId, session.id, { status: "completed" });
      await clearSkipTemplateIds(userId);
    }
  }

  const refreshed = await getSession(userId, sessionId);
  return refreshed ? loadSessionDetail(userId, refreshed) : null;
}

export async function completeSessionAsPlanned(
  userId: string,
  sessionId: string,
  input: CompleteSessionInput = {},
): Promise<SessionDetail | null> {
  const session = await getSession(userId, sessionId);
  if (!session) {
    return null;
  }

  const detail = await getSessionDetail(userId, sessionId);
  if (!detail) {
    return null;
  }

  const overrides = new Map(
    (input.sets ?? []).map((set) => [set.id, set] as const),
  );
  const supabase = createSupabaseServerClient();

  for (const item of detail.exercises) {
    for (const set of item.sets) {
      const override = overrides.get(set.id);
      const actual_weight =
        override?.actual_weight !== undefined
          ? override.actual_weight
          : (set.actual_weight ?? set.planned_weight);
      const actual_reps =
        override?.actual_reps !== undefined
          ? override.actual_reps
          : (set.actual_reps ?? set.planned_reps);
      const actual_seconds =
        override?.actual_seconds !== undefined
          ? override.actual_seconds
          : (set.actual_seconds ?? set.planned_seconds);

      if (
        (actual_weight == null || actual_weight <= 0) &&
        set.planned_weight != null
      ) {
        throw new Error("Укажите фактический вес.");
      }

      const updated = await supabase
        .from("workout_sets")
        .update({
          actual_weight,
          actual_reps,
          actual_seconds,
          is_completed: true,
        })
        .eq("user_id", userId)
        .eq("id", set.id);

      if (updated.error) {
        throw updated.error;
      }
    }
  }

  await patchSession(userId, session.id, { status: "completed" });
  await clearSkipTemplateIds(userId);
  const refreshed = await getSession(userId, sessionId);
  return refreshed ? loadSessionDetail(userId, refreshed) : null;
}

async function ensureSessionPlan(userId: string, session: WorkoutSession) {
  const supabase = createSupabaseServerClient();
  const existing = await supabase
    .from("session_exercises")
    .select("id")
    .eq("user_id", userId)
    .eq("session_id", session.id)
    .limit(1);

  if (existing.error) {
    throw existing.error;
  }

  if ((existing.data ?? []).length > 0) {
    return;
  }

  const candidates = await listPlanExercises(userId, session);
  const phaseMaxes = session.phase_id
    ? await listCurrentPhaseMaxes(userId, session.phase_id)
    : new Map();
  const catalog = await listExercises(userId, "active");
  const globalMaxes = new Map(
    catalog.map((exercise) => [
      exercise.id,
      exercise.current_max?.max_weight ?? null,
    ]),
  );
  const settings = await ensureWorkoutSettings(userId);

  let sortOrder = 10;
  for (const exercise of candidates) {
    const maxWeight =
      phaseMaxes.get(exercise.id)?.max_weight ??
      globalMaxes.get(exercise.id) ??
      null;
    if (maxWeight == null || maxWeight <= 0) {
      continue;
    }

    if (exercise.formula_preset === "none") {
      continue;
    }

    await insertSessionExercise(
      userId,
      session,
      exercise,
      maxWeight,
      sortOrder,
      settings.formulas,
    );
    sortOrder += 10;
  }
}

async function insertSessionExercise(
  userId: string,
  session: WorkoutSession,
  exercise: Exercise,
  maxWeight: number,
  sortOrder: number,
  formulas: WorkoutFormulas,
) {
  const phase = await getPhase(userId, session.phase_id);
  const phaseType = phase?.phase_type ?? "ramp";
  const formula = resolvePhaseSpec(
    formulas[session.workout_type][phaseType],
    session.workout_type,
    phaseType,
    exercise.formula_preset,
    formulas.warmups,
  );
  const planned = plannedSetsFromFormula(
    formula,
    maxWeight,
    exercise.weight_step,
    session.workout_type,
  );

  const supabase = createSupabaseServerClient();
  const inserted = await supabase
    .from("session_exercises")
    .insert({
      user_id: userId,
      session_id: session.id,
      exercise_id: exercise.id,
      sort_order: sortOrder,
      max_weight: maxWeight,
    })
    .select("*")
    .single();

  if (inserted.error || !inserted.data) {
    if (inserted.error?.code === "23505") {
      return;
    }
    throw inserted.error ?? new Error("Session exercise insert failed");
  }

  const sessionExercise = mapSessionExercise(
    inserted.data as Record<string, unknown>,
  );
  if (planned.length === 0) {
    return;
  }

  const setsInsert = await supabase.from("workout_sets").insert(
    planned.map((set) => ({
      user_id: userId,
      session_exercise_id: sessionExercise.id,
      set_type: set.set_type,
      set_number: set.set_number,
      planned_weight: set.planned_weight,
      planned_reps: set.planned_reps,
      planned_seconds: set.planned_seconds,
    })),
  );

  if (setsInsert.error) {
    throw setsInsert.error;
  }
}

async function loadSessionDetail(
  userId: string,
  session: WorkoutSession,
): Promise<SessionDetail> {
  const supabase = createSupabaseServerClient();
  const phase = session.phase_id
    ? await getPhase(userId, session.phase_id)
    : null;
  const template = session.template_id
    ? await getTemplate(userId, session.template_id)
    : null;
  const exerciseRows = await supabase
    .from("session_exercises")
    .select("*")
    .eq("user_id", userId)
    .eq("session_id", session.id)
    .order("sort_order", { ascending: true });

  if (exerciseRows.error) {
    throw exerciseRows.error;
  }

  const sessionExercises = (exerciseRows.data ?? []).map((row) =>
    mapSessionExercise(row as Record<string, unknown>),
  );
  const exerciseIds = sessionExercises.map((item) => item.exercise_id);
  const exercisesById = await mapExercisesById(userId, exerciseIds);
  const setsByExercise = await listSetsBySessionExercises(
    userId,
    sessionExercises.map((item) => item.id),
  );

  return {
    session,
    template,
    phase,
    exercises: sessionExercises.flatMap((item) => {
      const exercise = exercisesById.get(item.exercise_id);
      if (!exercise) {
        return [];
      }

      return [
        {
          ...item,
          exercise,
          sets: setsByExercise.get(item.id) ?? [],
        },
      ];
    }),
  };
}

async function listPlanExercises(userId: string, session: WorkoutSession) {
  if (session.template_id) {
    const template = await getTemplate(userId, session.template_id);
    return template?.exercises ?? [];
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("exercises")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (result.error) {
    throw result.error;
  }

  const exercises = (result.data ?? []).map((row) =>
    mapExercise(row as Record<string, unknown>),
  );

  return exercises.filter(
    (exercise) =>
      exercise.workout_type === "both" ||
      exercise.workout_type === session.workout_type,
  );
}

async function mapExercisesById(userId: string, ids: string[]) {
  const map = new Map<string, Exercise>();
  if (ids.length === 0) {
    return map;
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("exercises")
    .select("*")
    .eq("user_id", userId)
    .in("id", ids);

  if (result.error) {
    throw result.error;
  }

  for (const row of result.data ?? []) {
    const exercise = mapExercise(row as Record<string, unknown>);
    map.set(exercise.id, exercise);
  }

  return map;
}

async function listSetsBySessionExercises(userId: string, ids: string[]) {
  const map = new Map<string, WorkoutSet[]>();
  if (ids.length === 0) {
    return map;
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_sets")
    .select("*")
    .eq("user_id", userId)
    .in("session_exercise_id", ids)
    .order("set_number", { ascending: true });

  if (result.error) {
    throw result.error;
  }

  for (const row of result.data ?? []) {
    const set = mapWorkoutSet(row as Record<string, unknown>);
    const current = map.get(set.session_exercise_id) ?? [];
    current.push(set);
    map.set(set.session_exercise_id, current);
  }

  return map;
}

async function getOwnedExercise(userId: string, id: string) {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("exercises")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return null;
  }

  return mapExercise(result.data as Record<string, unknown>);
}

async function resolveExerciseMax(
  userId: string,
  session: WorkoutSession,
  exerciseId: string,
): Promise<number> {
  if (session.phase_id) {
    const maxes = await listCurrentPhaseMaxes(userId, session.phase_id);
    const phaseMax = maxes.get(exerciseId)?.max_weight;
    if (phaseMax != null && phaseMax > 0) {
      return phaseMax;
    }
  }

  const exercise = await getExercise(userId, exerciseId);
  const globalMax = exercise?.current_max?.max_weight;
  if (globalMax != null && globalMax > 0) {
    return globalMax;
  }

  throw new Error("Для упражнения нет максимума.");
}

async function getPhase(
  userId: string,
  phaseId: string | null,
): Promise<WorkoutPhase | null> {
  if (!phaseId) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("workout_phases")
    .select("*")
    .eq("user_id", userId)
    .eq("id", phaseId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return null;
  }

  return mapWorkoutPhase(result.data as Record<string, unknown>);
}

function mapSessionExercise(row: Record<string, unknown>): SessionExercise {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    session_id: String(row.session_id),
    exercise_id: String(row.exercise_id),
    sort_order: toNumber(row.sort_order),
    max_weight: toNumber(row.max_weight),
    created_at: String(row.created_at),
  };
}

function mapWorkoutSet(row: Record<string, unknown>): WorkoutSet {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    session_exercise_id: String(row.session_exercise_id),
    set_type: row.set_type === "work" ? "work" : "warmup",
    set_number: toNumber(row.set_number),
    planned_weight: toNullableNumber(row.planned_weight),
    planned_reps: toNullableNumber(row.planned_reps),
    planned_seconds: toNullableNumber(row.planned_seconds),
    actual_weight: toNullableNumber(row.actual_weight),
    actual_reps: toNullableNumber(row.actual_reps),
    actual_seconds: toNullableNumber(row.actual_seconds),
    is_completed: Boolean(row.is_completed),
    created_at: String(row.created_at),
  };
}
