import type { NextResponse } from "next/server";

import { failRoute, jsonOk, whenError, whenMessage } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { fillMealRemaining, PastDayLockedError } from "@/lib/days";

type RouteContext = {
  params: Promise<{ mealId: string }>;
};

export async function POST(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { mealId } = await context.params;

  try {
    const day = await fillMealRemaining(auth.session.userId, mealId);
    return jsonOk({ day });
  } catch (error) {
    return failRoute(error, [
      whenError(PastDayLockedError, 409),
      whenMessage("Meal not found", 404, "Приём пищи не найден."),
    ]);
  }
}
