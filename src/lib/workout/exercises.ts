import { z } from "zod";

import { isIsoDate } from "@/lib/days";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Exercise,
  ExerciseCategory,
  ExerciseSlot,
  ExerciseUnit,
  ExerciseWithMax,
  ExerciseWorkoutType,
  FormulaPreset,
  GlobalMax,
} from "@/lib/types";
import {
  defaultUnitForWorkoutType,
  EXERCISE_CATEGORIES,
  EXERCISE_SLOTS,
  EXERCISE_UNITS,
  EXERCISE_WORKOUT_TYPES,
  FORMULA_PRESETS,
} from "@/lib/workout/labels";
import { toNullableString, toNumber } from "@/lib/workout/numbers";

const optionalText = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value == null) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  });

export const exerciseCreateSchema = z
  .object({
    name: z.string().trim().min(1, "Название обязательно."),
    short_name: optionalText,
    category: z.enum(EXERCISE_CATEGORIES),
    workout_type: z.enum(EXERCISE_WORKOUT_TYPES),
    unit: z.enum(EXERCISE_UNITS).optional(),
    weight_step: z.number().finite().positive().optional(),
    formula_preset: z.enum(FORMULA_PRESETS).optional(),
    slot: z.enum(EXERCISE_SLOTS).nullable().optional(),
    max_weight: z.number().finite().positive(),
    achieved_at: z.string().optional(),
  })
  .transform((value) => ({
    name: value.name,
    short_name: value.short_name ?? null,
    category: value.category,
    workout_type: value.workout_type,
    unit: value.unit ?? defaultUnitForWorkoutType(value.workout_type),
    weight_step: value.weight_step ?? 2.5,
    formula_preset: value.formula_preset ?? "barbell",
    slot: value.slot ?? null,
    max_weight: value.max_weight,
    achieved_at: value.achieved_at,
  }));

export const exerciseUpdateSchema = z.object({
  name: z.string().trim().min(1, "Название обязательно."),
  short_name: optionalText,
  category: z.enum(EXERCISE_CATEGORIES),
  workout_type: z.enum(EXERCISE_WORKOUT_TYPES),
  unit: z.enum(EXERCISE_UNITS).optional(),
  weight_step: z.number().finite().positive().optional(),
  formula_preset: z.enum(FORMULA_PRESETS).optional(),
  slot: z.enum(EXERCISE_SLOTS).nullable().optional(),
});

export type ExerciseCreateInput = z.infer<typeof exerciseCreateSchema>;
export type ExerciseUpdateInput = z.infer<typeof exerciseUpdateSchema>;

export async function listExercises(
  userId: string,
  filter: "active" | "archived" | "all" = "active",
): Promise<ExerciseWithMax[]> {
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("exercises")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (filter === "active") {
    query = query.eq("is_active", true);
  } else if (filter === "archived") {
    query = query.eq("is_active", false);
  }

  const result = await query;
  if (result.error) {
    throw result.error;
  }

  const exercises = (result.data ?? []).map((row) =>
    mapExercise(row as Record<string, unknown>),
  );
  const maxes = await listGlobalMaxes(
    userId,
    exercises.map((exercise) => exercise.id),
  );

  return exercises.map((exercise) => attachMaxes(exercise, maxes));
}

export async function getExercise(
  userId: string,
  id: string,
): Promise<ExerciseWithMax | null> {
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

  const exercise = mapExercise(result.data as Record<string, unknown>);
  const maxes = await listGlobalMaxes(userId, [exercise.id]);
  return attachMaxes(exercise, maxes);
}

export async function createExercise(
  userId: string,
  input: ExerciseCreateInput,
): Promise<ExerciseWithMax> {
  const supabase = createSupabaseServerClient();
  const inserted = await supabase
    .from("exercises")
    .insert({
      user_id: userId,
      name: input.name,
      short_name: input.short_name,
      category: input.category,
      workout_type: input.workout_type,
      unit: input.unit,
      weight_step: input.weight_step,
      formula_preset: input.formula_preset,
      slot: input.slot,
    })
    .select("*")
    .single();

  if (inserted.error || !inserted.data) {
    throw inserted.error ?? new Error("Exercise insert failed");
  }

  const exercise = mapExercise(inserted.data as Record<string, unknown>);
  await insertGlobalMax(userId, {
    exerciseId: exercise.id,
    maxWeight: input.max_weight,
    achievedAt: resolveAchievedAt(input.achieved_at),
  });
  await copyMaxToCurrentPhase(supabase, userId, exercise.id, input.max_weight);

  const created = await getExercise(userId, exercise.id);
  if (!created) {
    throw new Error("Exercise lookup failed");
  }

  return created;
}

export async function updateExercise(
  userId: string,
  id: string,
  input: ExerciseUpdateInput,
): Promise<ExerciseWithMax | null> {
  const supabase = createSupabaseServerClient();
  const updated = await supabase
    .from("exercises")
    .update({
      name: input.name,
      short_name: input.short_name ?? null,
      category: input.category,
      workout_type: input.workout_type,
      unit: input.unit ?? defaultUnitForWorkoutType(input.workout_type),
      ...(input.weight_step != null ? { weight_step: input.weight_step } : {}),
      ...(input.formula_preset != null
        ? { formula_preset: input.formula_preset }
        : {}),
      ...(input.slot !== undefined ? { slot: input.slot } : {}),
    })
    .eq("user_id", userId)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (updated.error) {
    throw updated.error;
  }

  if (!updated.data) {
    return null;
  }

  return getExercise(userId, id);
}

export async function archiveExercise(
  userId: string,
  id: string,
  archived: boolean,
): Promise<ExerciseWithMax | null> {
  const supabase = createSupabaseServerClient();
  const updated = await supabase
    .from("exercises")
    .update({
      is_active: !archived,
      archived_at: archived ? new Date().toISOString() : null,
    })
    .eq("user_id", userId)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (updated.error) {
    throw updated.error;
  }

  if (!updated.data) {
    return null;
  }

  return getExercise(userId, id);
}

export async function raiseGlobalMax(input: {
  userId: string;
  exerciseId: string;
  maxWeight: number;
  achievedAt: string;
  phaseId?: string | null;
  workoutSessionId?: string | null;
}): Promise<GlobalMax | null> {
  const maxes = await listGlobalMaxes(input.userId, [input.exerciseId]);
  const current = pickCurrentMax(maxes.get(input.exerciseId) ?? []);
  if (current && input.maxWeight <= current.max_weight) {
    return current;
  }

  return insertGlobalMax(input.userId, {
    exerciseId: input.exerciseId,
    maxWeight: input.maxWeight,
    achievedAt: input.achievedAt,
    phaseId: input.phaseId ?? null,
    workoutSessionId: input.workoutSessionId ?? null,
  });
}

export function mapExercise(row: Record<string, unknown>): Exercise {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name),
    short_name: toNullableString(row.short_name),
    category: toCategory(row.category),
    workout_type: toWorkoutType(row.workout_type),
    unit: toUnit(row.unit),
    weight_step: toNumber(row.weight_step) || 2.5,
    formula_preset: toPreset(row.formula_preset),
    slot: toExerciseSlot(row.slot),
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    archived_at: toNullableString(row.archived_at),
  };
}

export function mapGlobalMax(row: Record<string, unknown>): GlobalMax {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    exercise_id: String(row.exercise_id),
    max_weight: toNumber(row.max_weight),
    achieved_at: String(row.achieved_at).slice(0, 10),
    phase_id: toNullableString(row.phase_id),
    workout_session_id: toNullableString(row.workout_session_id),
    created_at: String(row.created_at),
  };
}

async function listGlobalMaxes(
  userId: string,
  exerciseIds: string[],
): Promise<Map<string, GlobalMax[]>> {
  const byExercise = new Map<string, GlobalMax[]>();
  if (exerciseIds.length === 0) {
    return byExercise;
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("global_maxes")
    .select("*")
    .eq("user_id", userId)
    .in("exercise_id", exerciseIds)
    .order("achieved_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (result.error) {
    throw result.error;
  }

  for (const row of result.data ?? []) {
    const record = mapGlobalMax(row as Record<string, unknown>);
    const current = byExercise.get(record.exercise_id) ?? [];
    current.push(record);
    byExercise.set(record.exercise_id, current);
  }

  return byExercise;
}

async function copyMaxToCurrentPhase(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string,
  exerciseId: string,
  maxWeight: number,
): Promise<void> {
  const currentPhase = await supabase
    .from("workout_phases")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "current")
    .maybeSingle();

  if (currentPhase.error) {
    throw currentPhase.error;
  }

  if (!currentPhase.data) {
    return;
  }

  const inserted = await supabase.from("phase_maxes").insert({
    user_id: userId,
    phase_id: currentPhase.data.id,
    exercise_id: exerciseId,
    max_weight: maxWeight,
    source: "manual",
  });

  if (inserted.error) {
    throw inserted.error;
  }
}

async function insertGlobalMax(
  userId: string,
  input: {
    exerciseId: string;
    maxWeight: number;
    achievedAt: string;
    phaseId?: string | null;
    workoutSessionId?: string | null;
  },
): Promise<GlobalMax> {
  const supabase = createSupabaseServerClient();
  const inserted = await supabase
    .from("global_maxes")
    .insert({
      user_id: userId,
      exercise_id: input.exerciseId,
      max_weight: input.maxWeight,
      achieved_at: input.achievedAt,
      phase_id: input.phaseId ?? null,
      workout_session_id: input.workoutSessionId ?? null,
    })
    .select("*")
    .single();

  if (inserted.error || !inserted.data) {
    throw inserted.error ?? new Error("Global max insert failed");
  }

  return mapGlobalMax(inserted.data as Record<string, unknown>);
}

function attachMaxes(
  exercise: Exercise,
  maxes: Map<string, GlobalMax[]>,
): ExerciseWithMax {
  const history = maxes.get(exercise.id) ?? [];
  return {
    ...exercise,
    current_max: pickCurrentMax(history),
    max_history: history,
  };
}

function pickCurrentMax(history: GlobalMax[]): GlobalMax | null {
  if (history.length === 0) {
    return null;
  }

  return history.reduce((best, record) => {
    if (record.max_weight > best.max_weight) {
      return record;
    }

    if (record.max_weight === best.max_weight) {
      if (record.achieved_at > best.achieved_at) {
        return record;
      }

      if (
        record.achieved_at === best.achieved_at &&
        record.created_at > best.created_at
      ) {
        return record;
      }
    }

    return best;
  });
}

function resolveAchievedAt(value: string | undefined): string {
  if (value && isIsoDate(value)) {
    return value;
  }

  return new Date().toISOString().slice(0, 10);
}

function toCategory(value: unknown): ExerciseCategory {
  if (value === "base" || value === "armwrestling" || value === "isolation") {
    return value;
  }

  return "armwrestling";
}

function toWorkoutType(value: unknown): ExerciseWorkoutType {
  if (value === "dynamic" || value === "static" || value === "both") {
    return value;
  }

  return "dynamic";
}

function toUnit(value: unknown): ExerciseUnit {
  if (value === "reps" || value === "seconds") {
    return value;
  }

  return "reps";
}

function toPreset(value: unknown): FormulaPreset {
  if (value === "cable_short") {
    return "cable";
  }

  if (value === "barbell" || value === "cable" || value === "none") {
    return value;
  }

  return "barbell";
}

function toExerciseSlot(value: unknown): ExerciseSlot | null {
  if (value === "a" || value === "b" || value === "c") {
    return value;
  }

  return null;
}
