import { z } from "zod";

export const templateItemWriteSchema = z.object({
  mealType: z.enum([
    "breakfast",
    "lunch",
    "snack",
    "dinner",
    "pre_workout",
    "post_workout",
  ]),
  foodId: z.string().min(1),
  grams: z.number().finite().positive(),
});

export const templateItemGramsSchema = z.object({
  grams: z.number().finite().positive(),
});

export type TemplateItemWriteInput = z.infer<typeof templateItemWriteSchema>;
