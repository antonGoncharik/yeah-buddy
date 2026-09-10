import { z } from "zod";

import { isRecord } from "@/lib/read";
import type {
  KindWarmups,
  WorkoutFormulas,
  WorkoutKind,
  WorkoutSettings,
} from "@/lib/types";
import {
  convertLegacyKind,
  hydrateCyclePhases,
  legacyCycle,
  legacyKeepsFourPhase,
} from "@/lib/workout/cycle";
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

const kindFormulasSchema = z.object({
  base: formulaPhaseSchema,
  phases: z.record(z.string(), formulaPhaseSchema).default({}),
});

const cyclePhaseSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .regex(/^[a-z][a-z0-9_]*$/),
  name: z.string().trim().min(1).max(40),
  skip_warmup: z.boolean(),
  increase_on_end: z.boolean(),
  percent_scale: z.number().finite().positive().max(3).optional(),
});

const warmupPresetsSchema = z.object({
  barbell: z.array(formulaSetSchema),
  cable: z.array(formulaSetSchema),
});

const kindWarmupsSchema = z.object({
  dynamic: warmupPresetsSchema,
  static: warmupPresetsSchema,
});

export const formulasSchema = z.object({
  dynamic: kindFormulasSchema,
  static: kindFormulasSchema,
  warmups: z.union([kindWarmupsSchema, warmupPresetsSchema]).optional(),
  cycle: z.array(cyclePhaseSchema).max(8),
});

const legacyKindSchema = z.object({
  ramp: formulaPhaseSchema,
  volume: formulaPhaseSchema,
  peak: formulaPhaseSchema,
  deload: formulaPhaseSchema,
});

const legacyFormulasSchema = z.object({
  dynamic: legacyKindSchema,
  static: legacyKindSchema,
  warmups: z.union([kindWarmupsSchema, warmupPresetsSchema]).optional(),
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
  return hydrateCyclePhases({
    dynamic: {
      base: value.dynamic.base,
      phases: value.dynamic.phases ?? {},
    },
    static: {
      base: value.static.base,
      phases: value.static.phases ?? {},
    },
    warmups: normalizeWarmups(value.warmups),
    cycle: value.cycle ?? [],
  });
}

function normalizeWarmups(
  value: z.infer<typeof formulasSchema>["warmups"],
): Record<WorkoutKind, KindWarmups> {
  if (value == null) {
    return structuredClone(DEFAULT_WARMUP_PRESETS);
  }

  if ("dynamic" in value && "static" in value) {
    return structuredClone(value);
  }

  return {
    dynamic: structuredClone(value),
    static: structuredClone(DEFAULT_WARMUP_PRESETS.static),
  };
}

function parseFormulas(value: unknown): WorkoutFormulas {
  const stripped = stripLegacyCableShort(value);
  const parsed = formulasSchema.safeParse(stripped);
  if (parsed.success) {
    return fillFormulas(parsed.data);
  }

  const legacy = legacyFormulasSchema.safeParse(stripped);
  if (legacy.success) {
    const keep = legacyKeepsFourPhase(legacy.data.dynamic);
    return hydrateCyclePhases({
      dynamic: convertLegacyKind(legacy.data.dynamic, keep),
      static: convertLegacyKind(legacy.data.static, keep),
      warmups: normalizeWarmups(legacy.data.warmups),
      cycle: legacyCycle(keep),
    });
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
