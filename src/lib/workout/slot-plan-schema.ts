import { z } from "zod";

import type { SlotPlan, TemplateSlot } from "@/lib/types";

export const MAX_SLOT_GROUPS = 6;
export const MAX_GROUP_SETS = 12;
export const MAX_TRACK_STEPS = 24;

const weight = z.number().finite().positive().max(1000);

export const slotLoadSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("percent"),
    percent: z.number().finite().min(1).max(200),
  }),
  z.object({
    type: z.literal("orm"),
    percent: z.number().finite().min(1).max(200),
  }),
  z.object({
    type: z.literal("track"),
    percent: z.number().finite().min(1).max(200).default(100),
    offset: z.number().finite().min(-500).max(500).default(0),
  }),
  z.object({ type: z.literal("fixed"), weight }),
  z.object({ type: z.literal("feel") }),
]);

export const slotSetGroupSchema = z
  .object({
    sets: z.number().int().min(1).max(MAX_GROUP_SETS),
    reps: z.number().int().positive().max(200).nullable().default(null),
    reps_to: z.number().int().positive().max(200).nullable().default(null),
    seconds: z.number().finite().positive().max(3600).nullable().default(null),
    load: slotLoadSchema,
  })
  .refine(
    (group) => (group.reps != null) !== (group.seconds != null),
    "Либо повторы, либо секунды.",
  )
  .refine(
    (group) =>
      group.reps_to == null ||
      (group.reps != null && group.reps_to > group.reps),
    "Верх диапазона больше низа.",
  );

export const MAX_SLOT_PHASES = 8;

export const slotPhaseGroupsSchema = z
  .record(
    z.string().regex(/^[a-z][a-z0-9_]*$/),
    z.array(slotSetGroupSchema).min(1).max(MAX_SLOT_GROUPS),
  )
  .refine(
    (map) => Object.keys(map).length <= MAX_SLOT_PHASES,
    "Этапов не больше восьми.",
  );

export const slotPlanSchema = z.object({
  groups: z.array(slotSetGroupSchema).min(1).max(MAX_SLOT_GROUPS).nullable(),
  phases: slotPhaseGroupsSchema.optional(),
  intensity: z.enum(["heavy", "light"]).nullable().default(null),
  warmup: z.boolean().default(true),
  note: z
    .string()
    .trim()
    .max(120)
    .nullable()
    .default(null)
    .transform((value) => (value === "" ? null : value)),
});

export const templateSlotSchema = z.object({
  exercise_id: z.string().uuid(),
  plan: slotPlanSchema.nullable().default(null),
});

export const trackStepsSchema = z.array(weight).min(1).max(MAX_TRACK_STEPS);

export const trackWriteSchema = z.object({
  steps: trackStepsSchema,
  position: z.number().int().min(0).optional(),
  name: z.string().trim().max(40).nullable().optional(),
});

export type TrackWriteInput = z.infer<typeof trackWriteSchema>;

/** Reads a stored/incoming plan; anything malformed becomes «по общему плану». */
export function parseSlotPlan(value: unknown): SlotPlan | null {
  if (value == null) {
    return null;
  }
  const parsed = slotPlanSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseTemplateSlot(value: unknown): TemplateSlot | null {
  const parsed = templateSlotSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
