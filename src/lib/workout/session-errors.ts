import { z } from "zod";

import { isIsoDate } from "@/lib/day/dates";
import { WORKOUT_TEMPLATE_EMPTY } from "@/lib/messages";

export class SessionLockedError extends Error {
  constructor() {
    super("Сделанную тренировку нельзя убрать.");
  }
}

export class SessionConflictError extends Error {
  constructor(message = "На эту дату тренировка уже есть.") {
    super(message);
  }
}

export class TemplateEmptyError extends Error {
  constructor() {
    super(WORKOUT_TEMPLATE_EMPTY);
    this.name = "TemplateEmptyError";
  }
}

export const createSessionSchema = z.object({
  session_date: z.string().refine(isIsoDate, "Проверь дату."),
  template_id: z.string().uuid(),
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
});

export const patchSessionSchema = z.object({
  status: z.enum(["planned", "completed", "skipped"]).optional(),
  note: z.union([z.string(), z.null()]).optional(),
  feel: z.enum(["easy", "close", "miss"]).nullable().optional(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type PatchSessionInput = z.infer<typeof patchSessionSchema>;
