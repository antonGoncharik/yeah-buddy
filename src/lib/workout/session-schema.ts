import { z } from "zod";

export const patchSetSchema = z.object({
  actual_weight: z.number().finite().positive().nullable().optional(),
  actual_reps: z.number().int().positive().nullable().optional(),
  actual_seconds: z.number().finite().positive().nullable().optional(),
  is_completed: z.boolean().optional(),
});

export const completeSessionSchema = z.object({
  note: z.union([z.string(), z.null()]).optional(),
  feel: z.enum(["easy", "close", "miss"]).nullable().optional(),
  sets: z
    .array(
      z.object({
        id: z.string().uuid(),
        actual_weight: z.number().finite().positive().nullable().optional(),
        actual_reps: z.number().int().positive().nullable().optional(),
        actual_seconds: z.number().finite().positive().nullable().optional(),
      }),
    )
    .optional(),
});

export type PatchSetInput = z.infer<typeof patchSetSchema>;
export type CompleteSessionInput = z.infer<typeof completeSessionSchema>;
