import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WorkoutKind } from "@/lib/types";
import {
  type ExerciseTestAttempt,
  maxAfterTest,
  testWasPassed,
} from "@/lib/workout/test-raise";

export async function loadTestMaxes(input: {
  userId: string;
  phaseId: string;
  phaseKey: string;
  rows: Array<{ exerciseId: string; maxKg: number; stepKg: number }>;
}): Promise<Map<string, number>> {
  const attempts = await attemptsByExercise(input.userId, input.phaseId);
  const previousFailed = await exercisesThatMissedPreviousTest(
    input.userId,
    input.phaseId,
    input.phaseKey,
  );
  const proposed = new Map<string, number>();
  for (const row of input.rows) {
    proposed.set(
      row.exerciseId,
      maxAfterTest({
        maxKg: row.maxKg,
        stepKg: row.stepKg,
        attempts: attempts.get(row.exerciseId) ?? [],
        previousFailed: previousFailed.has(row.exerciseId),
      }),
    );
  }
  return proposed;
}

async function exercisesThatMissedPreviousTest(
  userId: string,
  phaseId: string,
  phaseKey: string,
): Promise<Set<string>> {
  const missed = new Set<string>();
  const previousPhaseId = await previousTestPhaseId(userId, phaseId, phaseKey);
  if (!previousPhaseId) {
    return missed;
  }

  const supabase = createSupabaseServerClient();
  const maxes = await supabase
    .from("phase_maxes")
    .select("exercise_id, max_weight")
    .eq("user_id", userId)
    .eq("phase_id", previousPhaseId)
    .order("set_at", { ascending: false });
  if (maxes.error) {
    throw maxes.error;
  }

  const latest = new Map<string, number>();
  for (const row of maxes.data ?? []) {
    const exerciseId = String(row.exercise_id);
    if (!latest.has(exerciseId)) {
      const maxKg = toNumber(row.max_weight);
      if (maxKg != null) {
        latest.set(exerciseId, maxKg);
      }
    }
  }
  const steps = await weightSteps(userId, [...latest.keys()]);
  const attempts = await attemptsByExercise(userId, previousPhaseId);
  for (const [exerciseId, maxKg] of latest) {
    const stepKg = steps.get(exerciseId);
    if (stepKg == null) {
      continue;
    }
    const passed = testWasPassed({
      maxKg,
      stepKg,
      attempts: attempts.get(exerciseId) ?? [],
    });
    if (!passed) {
      missed.add(exerciseId);
    }
  }
  return missed;
}

async function previousTestPhaseId(
  userId: string,
  phaseId: string,
  phaseKey: string,
): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  const current = await supabase
    .from("workout_phases")
    .select("macro_cycle_id")
    .eq("user_id", userId)
    .eq("id", phaseId)
    .maybeSingle();
  if (current.error) {
    throw current.error;
  }
  const macroId = current.data?.macro_cycle_id;
  if (typeof macroId !== "string") {
    return null;
  }

  const macro = await supabase
    .from("macro_cycles")
    .select("number")
    .eq("user_id", userId)
    .eq("id", macroId)
    .maybeSingle();
  if (macro.error) {
    throw macro.error;
  }
  const number = macro.data?.number;
  if (typeof number !== "number") {
    return null;
  }

  const previous = await supabase
    .from("macro_cycles")
    .select("id")
    .eq("user_id", userId)
    .lt("number", number)
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (previous.error) {
    throw previous.error;
  }
  if (!previous.data?.id) {
    return null;
  }

  const phase = await supabase
    .from("workout_phases")
    .select("id")
    .eq("user_id", userId)
    .eq("macro_cycle_id", previous.data.id)
    .eq("phase_type", phaseKey)
    .maybeSingle();
  if (phase.error) {
    throw phase.error;
  }
  return typeof phase.data?.id === "string" ? phase.data.id : null;
}

async function weightSteps(
  userId: string,
  exerciseIds: string[],
): Promise<Map<string, number>> {
  const steps = new Map<string, number>();
  if (exerciseIds.length === 0) {
    return steps;
  }
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("exercises")
    .select("id, weight_step")
    .eq("user_id", userId)
    .in("id", exerciseIds);
  if (result.error) {
    throw result.error;
  }
  for (const row of result.data ?? []) {
    const step = toNumber(row.weight_step);
    if (step != null && step > 0) {
      steps.set(String(row.id), step);
    }
  }
  return steps;
}

async function attemptsByExercise(
  userId: string,
  phaseId: string,
): Promise<Map<string, ExerciseTestAttempt[]>> {
  const grouped = new Map<string, ExerciseTestAttempt[]>();
  const supabase = createSupabaseServerClient();
  const sessions = await supabase
    .from("workout_sessions")
    .select("id, workout_type")
    .eq("user_id", userId)
    .eq("phase_id", phaseId)
    .eq("status", "completed");
  if (sessions.error) {
    throw sessions.error;
  }

  const sessionKind = new Map<string, WorkoutKind>();
  for (const row of sessions.data ?? []) {
    if (row.workout_type === "dynamic" || row.workout_type === "static") {
      sessionKind.set(String(row.id), row.workout_type);
    }
  }
  const sessionIds = [...sessionKind.keys()];
  if (sessionIds.length === 0) {
    return grouped;
  }

  const exercises = await supabase
    .from("session_exercises")
    .select("id, session_id, exercise_id")
    .eq("user_id", userId)
    .in("session_id", sessionIds);
  if (exercises.error) {
    throw exercises.error;
  }
  const exerciseRows = exercises.data ?? [];
  if (exerciseRows.length === 0) {
    return grouped;
  }

  const sets = await supabase
    .from("workout_sets")
    .select(
      "session_exercise_id, set_type, set_number, planned_weight, planned_reps, planned_seconds, actual_weight, actual_reps, actual_seconds, is_completed",
    )
    .eq("user_id", userId)
    .in(
      "session_exercise_id",
      exerciseRows.map((row) => String(row.id)),
    );
  if (sets.error) {
    throw sets.error;
  }

  const setsByExercise = new Map<string, Array<Record<string, unknown>>>();
  for (const set of sets.data ?? []) {
    const id = String(set.session_exercise_id);
    const list = setsByExercise.get(id) ?? [];
    list.push(set as Record<string, unknown>);
    setsByExercise.set(id, list);
  }

  for (const row of exerciseRows) {
    const kind = sessionKind.get(String(row.session_id));
    if (!kind) {
      continue;
    }
    const attempt = firstWorkAttempt(
      kind,
      setsByExercise.get(String(row.id)) ?? [],
    );
    if (!attempt) {
      continue;
    }
    const exerciseId = String(row.exercise_id);
    const list = grouped.get(exerciseId) ?? [];
    list.push(attempt);
    grouped.set(exerciseId, list);
  }
  return grouped;
}

function firstWorkAttempt(
  kind: WorkoutKind,
  sets: Array<Record<string, unknown>>,
): ExerciseTestAttempt | null {
  const work = sets
    .filter((set) => set.set_type === "work")
    .sort(
      (left, right) =>
        (toNumber(left.set_number) ?? 0) - (toNumber(right.set_number) ?? 0),
    );
  const set = work[0];
  if (!set) {
    return null;
  }

  const completed = set.is_completed === true;
  const plannedReps = toNumber(set.planned_reps);
  const plannedSeconds = toNumber(set.planned_seconds);
  const actualReps = toNumber(set.actual_reps);
  const actualSeconds = toNumber(set.actual_seconds);
  const weight =
    toNumber(set.actual_weight) ?? toNumber(set.planned_weight) ?? 0;

  return {
    kind,
    weight,
    reps: actualReps ?? (completed ? plannedReps : null),
    seconds: actualSeconds ?? (completed ? plannedSeconds : null),
    requiredReps: plannedReps,
    requiredSeconds: plannedSeconds,
  };
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
