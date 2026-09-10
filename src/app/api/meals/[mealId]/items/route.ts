import type { NextResponse } from "next/server";
import { z } from "zod";

import {
  failRoute,
  jsonOk,
  parseJsonSchema,
  whenError,
  whenMessage,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { addMealItem, PastDayLockedError } from "@/lib/days";

type RouteContext = {
  params: Promise<{ mealId: string }>;
};

const bodySchema = z.object({
  foodId: z.string().min(1),
  grams: z.number().finite().positive(),
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

  const parsed = await parseJsonSchema(request, bodySchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const item = await addMealItem(
      auth.session.userId,
      mealId,
      parsed.data.foodId,
      parsed.data.grams,
    );
    return jsonOk({ item });
  } catch (error) {
    return failRoute(error, [
      whenError(PastDayLockedError, 409),
      whenMessage("Meal not found", 404, "Приём пищи не найден."),
      whenMessage("Food not found", 404, "Продукт не найден."),
    ]);
  }
}
