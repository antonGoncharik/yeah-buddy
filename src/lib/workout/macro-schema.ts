import { z } from "zod";

import { isIsoDate } from "@/lib/day/dates";

const maxInputSchema = z.object({
  exercise_id: z.string().uuid(),
  max_weight: z.number().finite().positive(),
});

export const createMacroSchema = z.object({
  start_date: z.string().refine(isIsoDate, "Проверь дату."),
  note: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (value == null) {
        return null;
      }
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    }),
  maxes: z.array(maxInputSchema).min(1),
});

export const phaseMaxInputSchema = maxInputSchema;

export const confirmTransitionSchema = z.object({
  end_date: z.string().refine(isIsoDate, "Проверь дату."),
  maxes: z.array(maxInputSchema).min(1),
});

export type CreateMacroInput = z.infer<typeof createMacroSchema>;
export type ConfirmTransitionInput = z.infer<typeof confirmTransitionSchema>;
