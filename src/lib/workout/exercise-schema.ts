import { z } from "zod";

import {
  defaultUnitForWorkoutType,
  EXERCISE_CATEGORIES,
  EXERCISE_SLOTS,
  EXERCISE_UNITS,
  EXERCISE_WORKOUT_TYPES,
  FORMULA_PRESETS,
} from "@/lib/workout/labels";

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

export class StartingMaxLockedError extends Error {
  constructor() {
    super("Пока идёт цикл, вес поднимается на смене этапа.");
  }
}

export const exerciseUpdateSchema = z.object({
  name: z.string().trim().min(1, "Название обязательно."),
  short_name: optionalText,
  category: z.enum(EXERCISE_CATEGORIES),
  workout_type: z.enum(EXERCISE_WORKOUT_TYPES),
  unit: z.enum(EXERCISE_UNITS).optional(),
  weight_step: z.number().finite().positive().optional(),
  formula_preset: z.enum(FORMULA_PRESETS).optional(),
  slot: z.enum(EXERCISE_SLOTS).nullable().optional(),
  max_weight: z.number().finite().positive().optional(),
});

export type ExerciseCreateInput = z.infer<typeof exerciseCreateSchema>;
export type ExerciseUpdateInput = z.infer<typeof exerciseUpdateSchema>;
