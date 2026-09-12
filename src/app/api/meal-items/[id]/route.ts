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
  deleteMealItem,
  getDateForMeal,
  getMealItem,
  getUserCalendarToday,
  isWritableDayDate,
  PastDayLockedError,
  updateMealItemGrams,
} from "@/lib/days";
import { NOT_FOUND } from "@/lib/messages";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const patchSchema = z.object({
  grams: z.number().finite().positive(),
});

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;

  try {
    const item = await getMealItem(auth.session.userId, id);
    if (!item) {
      return jsonError(NOT_FOUND, 404);
    }

    const date = await getDateForMeal(auth.session.userId, item.meal_id);
    const today = await getUserCalendarToday(auth.session.userId);

    return jsonOk({
      item,
      date,
      today,
      writable: date != null && isWritableDayDate(date, today),
    });
  } catch (error) {
    return failRoute(error);
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;

  const parsed = await parseJsonSchema(request, patchSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const item = await updateMealItemGrams(
      auth.session.userId,
      id,
      parsed.data.grams,
    );
    return jsonOk({ item });
  } catch (error) {
    return failRoute(error, [
      whenError(PastDayLockedError, 409),
      whenMessage("Meal item not found", 404, NOT_FOUND),
    ]);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;

  try {
    const deleted = await deleteMealItem(auth.session.userId, id);
    if (!deleted) {
      return jsonError(NOT_FOUND, 404);
    }

    return jsonOk({ ok: true });
  } catch (error) {
    return failRoute(error, [whenError(PastDayLockedError, 409)]);
  }
}
