import type { NextResponse } from "next/server";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { deleteFood, getFood, updateFood } from "@/lib/food/store";
import { foodInputSchema } from "@/lib/foods";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const FOOD_NOT_FOUND = "Продукт не найден.";

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
    const food = await getFood(auth.session.userId, id);
    if (!food) {
      return jsonError(FOOD_NOT_FOUND, 404);
    }

    return jsonOk({ food });
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

  const parsed = await parseJsonSchema(request, foodInputSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const food = await updateFood(auth.session.userId, id, parsed.data);
    if (!food) {
      return jsonError(FOOD_NOT_FOUND, 404);
    }

    return jsonOk({ food });
  } catch (error) {
    return failRoute(error);
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
    const deleted = await deleteFood(auth.session.userId, id);
    if (!deleted) {
      return jsonError(FOOD_NOT_FOUND, 404);
    }

    return jsonOk({ ok: true });
  } catch (error) {
    return failRoute(error);
  }
}
