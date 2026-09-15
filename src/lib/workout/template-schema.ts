import { z } from "zod";

import { WORKOUT_NOT_FOUND } from "@/lib/messages";
import type { TemplateSlot } from "@/lib/types";
import { templateSlotSchema } from "@/lib/workout/slot-plan-schema";

export class TemplateNotFoundError extends Error {
  constructor() {
    super(WORKOUT_NOT_FOUND);
  }
}

/**
 * Either plain `exercise_ids` (old clients, presets) or `slots` with a
 * scheme per exercise. Both end up as `slots`.
 */
export const templateWriteSchema = z
  .object({
    name: z.string().trim().min(1, "Название обязательно."),
    kind: z.enum(["dynamic", "static"]),
    is_active: z.boolean().optional(),
    exercise_ids: z.array(z.string().uuid()).optional(),
    slots: z.array(templateSlotSchema).max(30).optional(),
  })
  .refine(
    (value) => value.exercise_ids != null || value.slots != null,
    "Нужны упражнения.",
  )
  .transform((value) => ({
    name: value.name,
    kind: value.kind,
    is_active: value.is_active,
    slots:
      value.slots ??
      (value.exercise_ids ?? []).map<TemplateSlot>((exercise_id) => ({
        exercise_id,
        plan: null,
      })),
  }));

export const rotationPatchSchema = z.object({
  rotation: z.array(
    z.object({
      id: z.string().uuid(),
      sort_order: z.number().int(),
      is_active: z.boolean(),
    }),
  ),
});

export type TemplateWriteInput = z.output<typeof templateWriteSchema>;
export type RotationPatch = z.infer<typeof rotationPatchSchema>;
