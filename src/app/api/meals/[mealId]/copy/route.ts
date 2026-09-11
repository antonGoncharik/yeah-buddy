import type { NextResponse } from "next/server";
import { z } from "zod";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenError,
  whenMessage,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import {
  copyMealFromDate,
  isIsoDate,
  MealConflictError,
  PastDayLockedError,
  SourceDayMissingError,
  SourceMealEmptyError,
  YesterdayMealEmptyError,
  YesterdayMissingError,
} from "@/lib/days";

type RouteContext = {
  params: Promise<{ mealId: string }>;
};

const bodySchema = z.object({
  sourceDate: z.string(),
  replace: z.boolean().optional(),
});

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { mealId } = await context.params;

  const parsed = await parseJsonSchema(request, bodySchema, (data) =>
    isIsoDate(data.sourceDate),
  );
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const day = await copyMealFromDate(
      auth.session.userId,
      mealId,
      parsed.data.sourceDate,
      parsed.data.replace ?? false,
    );
    return jsonOk({ day });
  } catch (error) {
    return failRoute(error, [
      whenError(PastDayLockedError, 409),
      whenError(YesterdayMissingError, 404),
      whenError(SourceDayMissingError, 404),
      whenError(YesterdayMealEmptyError, 404),
      whenError(SourceMealEmptyError, 404),
      whenMessage("Meal not found", 404, "Приём пищи не найден."),
      (err) =>
        err instanceof MealConflictError
          ? jsonError(err.message, 409, { code: err.code })
          : null,
    ]);
  }
}
