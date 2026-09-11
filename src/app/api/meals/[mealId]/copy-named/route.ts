import type { NextResponse } from "next/server";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenError,
  whenMessage,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { MealConflictError, PastDayLockedError } from "@/lib/days";
import { namedMealApplySchema } from "@/lib/named-meal/schema";
import { applyNamedMeal, NamedMealNotFoundError } from "@/lib/named-meal/store";

type RouteContext = {
  params: Promise<{ mealId: string }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { mealId } = await context.params;
  const parsed = await parseJsonSchema(request, namedMealApplySchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const day = await applyNamedMeal(
      auth.session.userId,
      mealId,
      parsed.data.namedMealId,
      parsed.data.replace ?? false,
    );
    return jsonOk({ day });
  } catch (error) {
    return failRoute(error, [
      whenError(PastDayLockedError, 409),
      whenError(NamedMealNotFoundError, 404),
      whenMessage("Meal not found", 404, "Приём пищи не найден."),
      (err) =>
        err instanceof MealConflictError
          ? jsonError(err.message, 409, { code: err.code })
          : null,
    ]);
  }
}
