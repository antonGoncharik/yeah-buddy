import type { NextResponse } from "next/server";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { setFoodFavorite } from "@/lib/food/store";
import { foodFavoriteSchema } from "@/lib/foods";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;

  const parsed = await parseJsonSchema(request, foodFavoriteSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const food = await setFoodFavorite(
      auth.session.userId,
      id,
      parsed.data.is_favorite,
    );
    if (!food) {
      return jsonError("Продукт не найден.", 404);
    }

    return jsonOk({ food });
  } catch (error) {
    return failRoute(error);
  }
}
