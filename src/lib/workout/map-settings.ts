import { z } from "zod";

import { isRecord } from "@/lib/read";
import type { WorkoutFormulas, WorkoutSettings } from "@/lib/types";
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

export const formulasSchema = z.object({
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

export function mapWorkoutSettings(
  row: Record<string, unknown>,
): WorkoutSettings {
  return {
    user_id: String(row.user_id),
    max_increase_percent: toNumber(row.max_increase_percent),
    formulas: parseFormulas(row.formulas),
    skip_template_ids: parseSkipTemplateIds(row),
    updated_at: String(row.updated_at),
  };
}

export function parseWorkoutSettings(value: unknown): WorkoutSettings | null {
  if (
    !isRecord(value) ||
    !isRecord(value.formulas) ||
    value.max_increase_percent == null
  ) {
    return null;
  }

  const settings = mapWorkoutSettings(value);
  if (settings.formulas.warmups == null) {
    return null;
  }

  return settings;
}

export function readWorkoutSettingsPayload(
  data: unknown,
): WorkoutSettings | null {
  return isRecord(data) ? parseWorkoutSettings(data.settings) : null;
}

export function fillFormulas(
  value: z.infer<typeof formulasSchema>,
): WorkoutFormulas {
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

function parseFormulas(value: unknown): WorkoutFormulas {
  const parsed = formulasSchema.safeParse(stripLegacyCableShort(value));
  if (parsed.success) {
    return fillFormulas(parsed.data);
  }

  return cloneFormulas(DEFAULT_WORKOUT_FORMULAS);
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseSkipTemplateIds(row: Record<string, unknown>): string[] {
  if ("skip_template_ids" in row) {
    return parseUuidList(row.skip_template_ids);
  }

  return parseSkipTemplateIdsFromFormulas(row.formulas);
}

function parseSkipTemplateIdsFromFormulas(value: unknown): string[] {
  if (!isRecord(value)) {
    return [];
  }

  const raw = Reflect.get(value, "_skip_template_ids");
  return parseUuidList(raw);
}

function parseUuidList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value.filter(
        (id): id is string => typeof id === "string" && UUID_PATTERN.test(id),
      ),
    ),
  ];
}

function stripLegacyCableShort(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }

  const row: Record<string, unknown> = { ...value };
  delete row._skip_template_ids;
  const warmups = row.warmups;
  if (!isRecord(warmups)) {
    return row;
  }

  const nextWarmups: Record<string, unknown> = { ...warmups };
  delete nextWarmups.cable_short;
  return { ...row, warmups: nextWarmups };
}
