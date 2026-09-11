import { z } from "zod";

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

export const legacyKindSchema = z.object({
  ramp: formulaPhaseSchema,
  volume: formulaPhaseSchema,
  peak: formulaPhaseSchema,
  deload: formulaPhaseSchema,
});

export const legacyFormulasSchema = z.object({
  dynamic: legacyKindSchema,
  static: legacyKindSchema,
  warmups: z.union([kindWarmupsSchema, warmupPresetsSchema]).optional(),
});
