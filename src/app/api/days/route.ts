import type { NextResponse } from "next/server";
import { z } from "zod";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenError,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import {
  createDayFromTemplate,
  DayConflictError,
  getDayByDate,
  getLastBodyWeight,
  getUserCalendarToday,
  isIsoDate,
  isWritableDayDate,
  listCopyDays,
  PastDayLockedError,
  recipeFromTemplate,
  yesterdayCopyHint,
} from "@/lib/days";
import { getActiveMealTemplate } from "@/lib/meal-templates";
import { CHECK_FIELDS } from "@/lib/messages";
import { listNamedMealHints } from "@/lib/named-meal/store";

const createSchema = z.object({
  date: z.string(),
  dayType: z.enum(["rest", "training"]),
});

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const date = new URL(request.url).searchParams.get("date") ?? "";
  if (!isIsoDate(date)) {
    return jsonError(CHECK_FIELDS, 400);
  }

  try {
    const today = await getUserCalendarToday(auth.session.userId);
    const [
      day,
      yesterday,
      lastBodyWeight,
      copyDays,
      namedMeals,
      rest,
      training,
    ] = await Promise.all([
      getDayByDate(auth.session.userId, date),
      yesterdayCopyHint(auth.session.userId, date),
      getLastBodyWeight(auth.session.userId, date),
      listCopyDays(auth.session.userId, date),
      listNamedMealHints(auth.session.userId),
      getActiveMealTemplate(auth.session.userId, "rest"),
      getActiveMealTemplate(auth.session.userId, "training"),
    ]);

    return jsonOk({
      day,
      today,
      writable: isWritableDayDate(date, today),
      yesterdayExists: yesterday.exists,
      yesterdayMealTypes: yesterday.mealTypes,
      lastBodyWeight,
      copyDays,
      namedMeals,
      recipes: {
        rest: recipeFromTemplate(rest),
        training: recipeFromTemplate(training),
      },
    });
  } catch (error) {
    return failRoute(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const parsed = await parseJsonSchema(request, createSchema, (data) =>
    isIsoDate(data.date),
  );
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const day = await createDayFromTemplate(
      auth.session.userId,
      parsed.data.date,
      parsed.data.dayType,
    );
    return jsonOk({ day });
  } catch (error) {
    return failRoute(error, [
      whenError(PastDayLockedError, 409),
      (err) =>
        err instanceof DayConflictError
          ? jsonError(err.message, 409, { code: err.code })
          : null,
    ]);
  }
}
