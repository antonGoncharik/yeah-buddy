import { z } from "zod";

import { WORKOUT_NOT_FOUND } from "@/lib/messages";

export class TemplateNotFoundError extends Error {
  constructor() {
    super(WORKOUT_NOT_FOUND);
  }
}

export const templateWriteSchema = z.object({
  name: z.string().trim().min(1, "Название обязательно."),
  kind: z.enum(["dynamic", "static"]),
  is_active: z.boolean().optional(),
  exercise_ids: z.array(z.string().uuid()),
});

export const rotationPatchSchema = z.object({
  rotation: z.array(
    z.object({
      id: z.string().uuid(),
      sort_order: z.number().int(),
      is_active: z.boolean(),
    }),
  ),
});

export type TemplateWriteInput = z.infer<typeof templateWriteSchema>;
export type RotationPatch = z.infer<typeof rotationPatchSchema>;
