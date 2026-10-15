import { z } from "zod";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenError,
  whenMessage,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { lumpMealItemSchema } from "@/lib/day/lump";
import {
  deleteMealItem,
  getDateForMeal,
  getDayByDate,
  getMealItem,
  getUserCalendarToday,
  isDayWritable,
  moveMealItem,
  PastDayLockedError,
  updateLumpMealItem,
  updateMealItemGrams,
  writeStateFromDay,
} from "@/lib/days";
import { NOT_FOUND } from "@/lib/messages";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const patchSchema = z.union([
  z.object({
    mealId: z.string().uuid(),
  }),
  z.object({
    grams: z.number().finite().positive(),
  }),
  lumpMealItemSchema,
]);

export const GET = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id } = await context.params;

    try {
      const item = await getMealItem(session.userId, id);
      if (!item) {
        return jsonError(NOT_FOUND, 404);
      }

      const date = await getDateForMeal(session.userId, item.meal_id);
      const today = await getUserCalendarToday(session.userId);
      const day =
        date == null ? null : await getDayByDate(session.userId, date);

      return jsonOk({
        item,
        date,
        today,
        writable:
          date != null && isDayWritable(date, today, writeStateFromDay(day)),
      });
    } catch (error) {
      return failRoute(error);
    }
  },
);

export const PATCH = sessionRoute(
  async (session, request, context: RouteContext) => {
    const { id } = await context.params;

    const parsed = await parseJsonSchema(request, patchSchema);
    if (!parsed.ok) {
      return parsed.response;
    }

    try {
      const item =
        "mealId" in parsed.data
          ? await moveMealItem(session.userId, id, parsed.data.mealId)
          : "grams" in parsed.data
            ? await updateMealItemGrams(session.userId, id, parsed.data.grams)
            : await updateLumpMealItem(session.userId, id, parsed.data);
      return jsonOk({ item });
    } catch (error) {
      return failRoute(error, [
        whenError(PastDayLockedError, 409),
        whenMessage("Meal item not found", 404, NOT_FOUND),
        whenMessage("Not a lump item", 400, "Это продукт, не строка."),
        whenMessage("Not a catalog item", 400, "Это строка, не продукт."),
        whenMessage(
          "Meal is on another day",
          400,
          "Перенести можно только внутри этого дня.",
        ),
      ]);
    }
  },
);

export const DELETE = sessionRoute(
  async (session, _request, context: RouteContext) => {
    const { id } = await context.params;

    try {
      const deleted = await deleteMealItem(session.userId, id);
      if (!deleted) {
        return jsonError(NOT_FOUND, 404);
      }

      return jsonOk({ ok: true });
    } catch (error) {
      return failRoute(error, [whenError(PastDayLockedError, 409)]);
    }
  },
);
