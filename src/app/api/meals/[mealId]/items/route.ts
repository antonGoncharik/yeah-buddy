import { z } from "zod";

import {
  failRoute,
  jsonOk,
  parseJsonSchema,
  whenError,
  whenMessage,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { lumpMealItemSchema } from "@/lib/day/lump";
import { addLumpMealItem, addMealItem, PastDayLockedError } from "@/lib/days";

type RouteContext = {
  params: Promise<{ mealId: string }>;
};

const bodySchema = z.union([
  lumpMealItemSchema,
  z.object({
    foodId: z.string().min(1),
    grams: z.number().finite().positive(),
  }),
]);

export const POST = sessionRoute(
  async (session, request, context: RouteContext) => {
    const { mealId } = await context.params;

    const parsed = await parseJsonSchema(request, bodySchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    try {
      const item =
        "foodId" in parsed.data
          ? await addMealItem(
              session.userId,
              mealId,
              parsed.data.foodId,
              parsed.data.grams,
            )
          : await addLumpMealItem(session.userId, mealId, parsed.data);
      return jsonOk({ item });
    } catch (error) {
      return failRoute(error, [
        whenError(PastDayLockedError, 409),
        whenMessage("Meal not found", 404, "Приём пищи не найден."),
        whenMessage("Food not found", 404, "Продукт не найден."),
      ]);
    }
  },
);
