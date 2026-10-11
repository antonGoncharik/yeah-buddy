import {
  failRoute,
  jsonOk,
  parseJsonSchema,
  whenError,
  whenMessage,
} from "@/lib/api/respond";
import { sessionRoute } from "@/lib/api/session-route";
import { PastDayLockedError } from "@/lib/days";
import { namedMealSaveSchema } from "@/lib/named-meal/schema";
import {
  listNamedMealHints,
  NamedMealEmptyError,
  NamedMealLimitError,
  saveNamedMealFromMeal,
} from "@/lib/named-meal/store";

export const GET = sessionRoute(async (session) => {
  const namedMeals = await listNamedMealHints(session.userId);
  return jsonOk({ namedMeals });
});

export const POST = sessionRoute(async (session, request) => {
  const parsed = await parseJsonSchema(request, namedMealSaveSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const namedMeal = await saveNamedMealFromMeal(
      session.userId,
      parsed.data.mealId,
      parsed.data.name,
    );
    return jsonOk({ namedMeal });
  } catch (error) {
    return failRoute(error, [
      whenError(PastDayLockedError, 409),
      whenError(NamedMealEmptyError, 400),
      whenError(NamedMealLimitError, 400),
      whenMessage("Meal not found", 404, "Приём пищи не найден."),
    ]);
  }
});
