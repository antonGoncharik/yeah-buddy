import type { NextResponse } from "next/server";

import {
  failRoute,
  jsonOk,
  parseJsonSchema,
  whenError,
  whenMessage,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { PastDayLockedError } from "@/lib/days";
import { namedMealSaveSchema } from "@/lib/named-meal/schema";
import {
  listNamedMealHints,
  NamedMealEmptyError,
  NamedMealLimitError,
  saveNamedMealFromMeal,
} from "@/lib/named-meal/store";

export async function GET(): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const namedMeals = await listNamedMealHints(auth.session.userId);
    return jsonOk({ namedMeals });
  } catch (error) {
    return failRoute(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const parsed = await parseJsonSchema(request, namedMealSaveSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const namedMeal = await saveNamedMealFromMeal(
      auth.session.userId,
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
}
