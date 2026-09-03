import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  FormulaPhaseSpec,
  PhaseType,
  WorkoutFormulas,
  WorkoutKind,
  WorkoutSettings,
} from "@/lib/types";
import { DEFAULT_WORKOUT_FORMULAS } from "@/lib/workout/default-formulas";
import { toNumber } from "@/lib/workout/numbers";

const formulaSetSchema = z.object({
  percent: z.number().finite().min(0),
  reps: z.number().int().positive().nullable(),
  seconds: z.number().finite().positive().nullable(),
});

const formulaPhaseSchema = z.object({
  warmup: z.array(formulaSetSchema),
  work: z.array(formulaSetSchema).min(1),
});

const formulasSchema = z.object({
  dynamic: z.object({
    ramp: formulaPhaseSchema,
    volume: formulaPhaseSchema,
    peak: formulaPhaseSchema,
    deload: formulaPhaseSchema,
  }),
  static: z.object({
    ramp: formulaPhaseSchema,
    volume: formulaPhaseSchema,
    peak: formulaPhaseSchema,
    deload: formulaPhaseSchema,
  }),
});

export const workoutSettingsPatchSchema = z.object({
  weight_step: z.number().finite().positive().optional(),
  max_increase_percent: z.number().finite().min(0).optional(),
  formulas: formulasSchema.optional(),
});

export type WorkoutSettingsPatch = z.infer<typeof workoutSettingsPatchSchema>;

export async function ensureWorkoutSettings(
  userId: string,
): Promise<WorkoutSettings> {
  const supabase = createSupabaseServerClient();
  const existing = await supabase
    .from("workout_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (existing.data) {
    return mapWorkoutSettings(existing.data as Record<string, unknown>);
  }

  const inserted = await supabase
    .from("workout_settings")
    .insert({
      user_id: userId,
      weight_step: 2.5,
      max_increase_percent: 5,
      formulas: DEFAULT_WORKOUT_FORMULAS,
    })
    .select("*")
    .single();

  if (inserted.error) {
    if (inserted.error.code === "23505") {
      const raced = await supabase
        .from("workout_settings")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (raced.error || !raced.data) {
        throw raced.error ?? new Error("Workout settings lookup failed");
      }

      return mapWorkoutSettings(raced.data as Record<string, unknown>);
    }

    throw inserted.error;
  }

  return mapWorkoutSettings(inserted.data as Record<string, unknown>);
}

export async function saveWorkoutSettings(
  userId: string,
  patch: WorkoutSettingsPatch,
): Promise<WorkoutSettings> {
  const current = await ensureWorkoutSettings(userId);
  const supabase = createSupabaseServerClient();
  const saved = await supabase
    .from("workout_settings")
    .update({
      weight_step: patch.weight_step ?? current.weight_step,
      max_increase_percent:
        patch.max_increase_percent ?? current.max_increase_percent,
      formulas: patch.formulas ?? current.formulas,
    })
    .eq("user_id", userId)
    .select("*")
    .single();

  if (saved.error || !saved.data) {
    throw saved.error ?? new Error("Workout settings save failed");
  }

  return mapWorkoutSettings(saved.data as Record<string, unknown>);
}

export function mapWorkoutSettings(
  row: Record<string, unknown>,
): WorkoutSettings {
  return {
    user_id: String(row.user_id),
    weight_step: toNumber(row.weight_step) || 2.5,
    max_increase_percent: toNumber(row.max_increase_percent),
    formulas: parseFormulas(row.formulas),
    updated_at: String(row.updated_at),
  };
}

function parseFormulas(value: unknown): WorkoutFormulas {
  const parsed = formulasSchema.safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }

  return DEFAULT_WORKOUT_FORMULAS;
}

export function getFormulaPhase(
  formulas: WorkoutFormulas,
  kind: WorkoutKind,
  phase: PhaseType,
): FormulaPhaseSpec {
  return formulas[kind][phase];
}
