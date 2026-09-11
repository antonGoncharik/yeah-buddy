import { NEED_ALL_WORKING_WEIGHTS } from "@/lib/messages";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CurrentMacroState, MaxSource, WorkoutPhase } from "@/lib/types";
import { firstCyclePhase } from "@/lib/workout/cycle";
import { listExercises, raiseGlobalMax } from "@/lib/workout/exercises";
import {
  CycleEmptyError,
  MacroConflictError,
  NoExercisesError,
} from "@/lib/workout/macro-errors";
import type { CreateMacroInput } from "@/lib/workout/macro-schema";
import { getCurrentMacroState } from "@/lib/workout/macro-state";
import { mapMacroCycle, mapWorkoutPhase } from "@/lib/workout/map-rows";
import { ensureWorkoutSettings } from "@/lib/workout/settings";

interface CreatePhaseInput {
  macroId: string;
  phaseType: string;
  name: string | null;
  sortOrder: number;
  startDate: string;
  maxes: Array<{
    exercise_id: string;
    max_weight: number;
    source: MaxSource;
  }>;
}

export async function createFirstMacro(
  userId: string,
  input: CreateMacroInput,
): Promise<CurrentMacroState> {
  const current = await getCurrentMacroState(userId);
  if (current.macro) {
    throw new MacroConflictError();
  }

  const exercises = await listExercises(userId, "active");
  if (exercises.length === 0) {
    throw new NoExercisesError();
  }

  const settings = await ensureWorkoutSettings(userId);
  const first = firstCyclePhase(settings.formulas.cycle);
  if (!first) {
    throw new CycleEmptyError();
  }

  const maxByExercise = new Map(
    input.maxes.map((item) => [item.exercise_id, item.max_weight]),
  );
  for (const exercise of exercises) {
    if (!maxByExercise.has(exercise.id)) {
      throw new Error(NEED_ALL_WORKING_WEIGHTS);
    }
  }

  const supabase = createSupabaseServerClient();
  const last = await supabase
    .from("macro_cycles")
    .select("number")
    .eq("user_id", userId)
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (last.error) {
    throw last.error;
  }

  const nextNumber =
    last.data && typeof last.data.number === "number"
      ? last.data.number + 1
      : 1;

  const createdMacro = await supabase
    .from("macro_cycles")
    .insert({
      user_id: userId,
      number: nextNumber,
      start_date: input.start_date,
      status: "current",
      note: input.note,
    })
    .select("*")
    .single();

  if (createdMacro.error || !createdMacro.data) {
    if (createdMacro.error?.code === "23505") {
      throw new MacroConflictError();
    }
    throw createdMacro.error ?? new Error("Macro insert failed");
  }

  const macro = mapMacroCycle(createdMacro.data as Record<string, unknown>);
  await createPhase(userId, {
    macroId: macro.id,
    phaseType: first.key,
    name: first.name,
    sortOrder: 1,
    startDate: input.start_date,
    maxes: exercises.map((exercise) => ({
      exercise_id: exercise.id,
      max_weight: maxByExercise.get(exercise.id) ?? 0,
      source: "manual" as const,
    })),
  });

  return getCurrentMacroState(userId);
}

export async function createPhase(
  userId: string,
  input: CreatePhaseInput,
): Promise<WorkoutPhase> {
  const supabase = createSupabaseServerClient();
  const inserted = await supabase
    .from("workout_phases")
    .insert({
      user_id: userId,
      macro_cycle_id: input.macroId,
      phase_type: input.phaseType,
      name: input.name,
      start_date: input.startDate,
      status: "current",
      sort_order: input.sortOrder,
    })
    .select("*")
    .single();

  if (inserted.error || !inserted.data) {
    throw inserted.error ?? new Error("Phase insert failed");
  }

  const phase = mapWorkoutPhase(inserted.data as Record<string, unknown>);
  if (input.maxes.length > 0) {
    const maxInsert = await supabase.from("phase_maxes").insert(
      input.maxes.map((item) => ({
        user_id: userId,
        phase_id: phase.id,
        exercise_id: item.exercise_id,
        max_weight: item.max_weight,
        source: item.source,
      })),
    );

    if (maxInsert.error) {
      throw maxInsert.error;
    }

    for (const item of input.maxes) {
      await raiseGlobalMax({
        userId,
        exerciseId: item.exercise_id,
        maxWeight: item.max_weight,
        achievedAt: input.startDate,
        phaseId: phase.id,
      });
    }
  }

  return phase;
}
