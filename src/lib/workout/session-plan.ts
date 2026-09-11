import { calendarToday } from "@/lib/day/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Exercise,
  SessionDetail,
  WorkoutFormulas,
  WorkoutSession,
} from "@/lib/types";
import { specForPhase } from "@/lib/workout/cycle";
import { listExercises } from "@/lib/workout/exercises";
import {
  plannedSetsFromFormula,
  resolvePhaseSpec,
} from "@/lib/workout/formulas";
import { listCurrentPhaseMaxes } from "@/lib/workout/macros";
import { mapSessionExercise } from "@/lib/workout/map-rows";
import { getPhase, loadSessionDetail } from "@/lib/workout/session-work-load";
import { getSession, getSessionOnDate } from "@/lib/workout/sessions";
import { ensureWorkoutSettings } from "@/lib/workout/settings";
import { getTemplate } from "@/lib/workout/templates";

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

export async function rebuildPlannedSession(
  userId: string,
  sessionId: string,
): Promise<SessionDetail | null> {
  const session = await getSession(userId, sessionId);
  if (session?.status !== "planned") {
    return session ? loadSessionDetail(userId, session) : null;
  }

  const detail = await loadSessionDetail(userId, session);
  if (
    detail.exercises.some((item) => item.sets.some((set) => set.is_completed))
  ) {
    return detail;
  }

  const supabase = createSupabaseServerClient();
  const deleted = await supabase
    .from("session_exercises")
    .delete()
    .eq("user_id", userId)
    .eq("session_id", sessionId);

  if (deleted.error) {
    throw deleted.error;
  }

  await ensureSessionPlan(userId, session);
  return loadSessionDetail(userId, session);
}

export async function rebuildTodaysPlannedSession(
  userId: string,
): Promise<void> {
  const session = await getSessionOnDate(userId, calendarToday());
  if (!session) {
    return;
  }
  await rebuildPlannedSession(userId, session.id);
}

export async function ensureSessionPlan(
  userId: string,
  session: WorkoutSession,
) {
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

export async function insertSessionExercise(
  userId: string,
  session: WorkoutSession,
  exercise: Exercise,
  maxWeight: number,
  sortOrder: number,
  formulas: WorkoutFormulas,
) {
  const phase = await getPhase(userId, session.phase_id);
  const phaseKey = phase?.phase_type ?? null;
  const skipWarmup = Boolean(
    phaseKey &&
      formulas.cycle.find((item) => item.key === phaseKey)?.skip_warmup,
  );
  const formula = resolvePhaseSpec(
    specForPhase(formulas, session.workout_type, phaseKey),
    session.workout_type,
    skipWarmup,
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

async function listPlanExercises(userId: string, session: WorkoutSession) {
  if (!session.template_id) {
    return [];
  }

  const template = await getTemplate(userId, session.template_id);
  return template?.exercises ?? [];
}
