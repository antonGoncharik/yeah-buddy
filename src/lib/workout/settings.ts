import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  FormulaPhaseSpec,
  WorkoutFormulas,
  WorkoutKind,
  WorkoutSettings,
} from "@/lib/types";
import { specForPhase } from "@/lib/workout/cycle";
import {
  cloneFormulas,
  DEFAULT_WORKOUT_FORMULAS,
} from "@/lib/workout/default-formulas";
import {
  fillFormulas,
  formulasSchema,
  mapWorkoutSettings,
} from "@/lib/workout/map-settings";

export { mapWorkoutSettings } from "@/lib/workout/map-settings";

export const workoutSettingsPatchSchema = z.object({
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
      formulas: cloneFormulas(DEFAULT_WORKOUT_FORMULAS),
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
        throw raced.error ?? inserted.error;
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
      max_increase_percent:
        patch.max_increase_percent ?? current.max_increase_percent,
      formulas: patch.formulas
        ? fillFormulas(patch.formulas)
        : current.formulas,
    })
    .eq("user_id", userId)
    .select("*")
    .single();

  if (saved.error || !saved.data) {
    throw saved.error ?? new Error("Workout settings save failed");
  }

  return mapWorkoutSettings(saved.data as Record<string, unknown>);
}

export async function skipTemplateInRotation(
  userId: string,
  templateId: string,
): Promise<WorkoutSettings> {
  const current = await ensureWorkoutSettings(userId);
  const skipTemplateIds = current.skip_template_ids.includes(templateId)
    ? current.skip_template_ids
    : [...current.skip_template_ids, templateId];
  return saveSkipTemplateIds(userId, skipTemplateIds);
}

export async function unskipLastTemplate(
  userId: string,
): Promise<WorkoutSettings> {
  const current = await ensureWorkoutSettings(userId);
  if (current.skip_template_ids.length === 0) {
    return current;
  }

  return saveSkipTemplateIds(userId, current.skip_template_ids.slice(0, -1));
}

export async function clearSkipTemplateIds(
  userId: string,
): Promise<WorkoutSettings> {
  return saveSkipTemplateIds(userId, []);
}

async function saveSkipTemplateIds(
  userId: string,
  skipTemplateIds: string[],
): Promise<WorkoutSettings> {
  await ensureWorkoutSettings(userId);
  const supabase = createSupabaseServerClient();
  const saved = await supabase
    .from("workout_settings")
    .update({
      skip_template_ids: skipTemplateIds,
    })
    .eq("user_id", userId)
    .select("*")
    .single();

  if (saved.error || !saved.data) {
    throw saved.error ?? new Error("Workout settings save failed");
  }

  return mapWorkoutSettings(saved.data as Record<string, unknown>);
}

export function getFormulaPhase(
  formulas: WorkoutFormulas,
  kind: WorkoutKind,
  phase: string | null,
): FormulaPhaseSpec {
  return specForPhase(formulas, kind, phase);
}
