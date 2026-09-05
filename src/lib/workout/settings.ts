import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  FormulaPhaseSpec,
  PhaseType,
  WorkoutFormulas,
  WorkoutKind,
  WorkoutSettings,
} from "@/lib/types";
import {
  cloneFormulas,
  DEFAULT_WARMUP_PRESETS,
  DEFAULT_WORKOUT_FORMULAS,
} from "@/lib/workout/default-formulas";
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

const warmupPresetsSchema = z.object({
  barbell: z.array(formulaSetSchema),
  cable: z.array(formulaSetSchema),
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
  warmups: warmupPresetsSchema.optional(),
});

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
      max_increase_percent: 5,
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
      max_increase_percent:
        patch.max_increase_percent ?? current.max_increase_percent,
      formulas: withSkipTemplateIds(
        patch.formulas ? fillFormulas(patch.formulas) : current.formulas,
        current.skip_template_ids,
      ),
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
    max_increase_percent: toNumber(row.max_increase_percent),
    formulas: parseFormulas(row.formulas),
    skip_template_ids: parseSkipTemplateIds(row.formulas),
    updated_at: String(row.updated_at),
  };
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseSkipTemplateIds(value: unknown): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  const raw = (value as { _skip_template_ids?: unknown })._skip_template_ids;
  if (!Array.isArray(raw)) {
    return [];
  }

  return [
    ...new Set(
      raw.filter(
        (id): id is string => typeof id === "string" && UUID_PATTERN.test(id),
      ),
    ),
  ];
}

function withSkipTemplateIds(
  formulas: WorkoutFormulas,
  skipTemplateIds: string[],
): WorkoutFormulas & { _skip_template_ids: string[] } {
  return {
    ...formulas,
    _skip_template_ids: skipTemplateIds,
  };
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
  const current = await ensureWorkoutSettings(userId);
  const supabase = createSupabaseServerClient();
  const saved = await supabase
    .from("workout_settings")
    .update({
      formulas: withSkipTemplateIds(current.formulas, skipTemplateIds),
    })
    .eq("user_id", userId)
    .select("*")
    .single();

  if (saved.error || !saved.data) {
    throw saved.error ?? new Error("Workout settings save failed");
  }

  return mapWorkoutSettings(saved.data as Record<string, unknown>);
}

function parseFormulas(value: unknown): WorkoutFormulas {
  const parsed = formulasSchema.safeParse(stripLegacyCableShort(value));
  if (parsed.success) {
    return fillFormulas(parsed.data);
  }

  return cloneFormulas(DEFAULT_WORKOUT_FORMULAS);
}

function stripLegacyCableShort(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const row = value as Record<string, unknown>;
  const warmups = row.warmups;
  if (!warmups || typeof warmups !== "object" || Array.isArray(warmups)) {
    return value;
  }

  const nextWarmups = { ...(warmups as Record<string, unknown>) };
  delete nextWarmups.cable_short;
  return { ...row, warmups: nextWarmups };
}

function fillFormulas(value: z.infer<typeof formulasSchema>): WorkoutFormulas {
  return {
    dynamic: value.dynamic,
    static: {
      ramp: { warmup: [], work: value.static.ramp.work },
      volume: { warmup: [], work: value.static.volume.work },
      peak: { warmup: [], work: value.static.peak.work },
      deload: { warmup: [], work: value.static.deload.work },
    },
    warmups: value.warmups
      ? structuredClone(value.warmups)
      : structuredClone(DEFAULT_WARMUP_PRESETS),
  };
}

export function getFormulaPhase(
  formulas: WorkoutFormulas,
  kind: WorkoutKind,
  phase: PhaseType,
): FormulaPhaseSpec {
  return formulas[kind][phase];
}
