import type { NextResponse } from "next/server";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import {
  deleteTemplateItem,
  FoodNotFoundError,
  getTemplateItem,
  MealTemplateItemNotFoundError,
  templateItemGramsSchema,
  updateTemplateItemGrams,
} from "@/lib/meal-templates";
import { NOT_FOUND } from "@/lib/messages";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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
    const item = await getTemplateItem(auth.session.userId, id);
    if (!item) {
      return jsonError(NOT_FOUND, 404);
    }

    return jsonOk({ item });
  } catch (error) {
    return failRoute(error, [
      (err) =>
        err instanceof FoodNotFoundError ? jsonError(NOT_FOUND, 404) : null,
    ]);
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

  const parsed = await parseJsonSchema(request, templateItemGramsSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const item = await updateTemplateItemGrams(
      auth.session.userId,
      id,
      parsed.data.grams,
    );
    return jsonOk({ item });
  } catch (error) {
    return failRoute(error, [
      (err) =>
        err instanceof MealTemplateItemNotFoundError ||
        err instanceof FoodNotFoundError
          ? jsonError(NOT_FOUND, 404)
          : null,
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
    const deleted = await deleteTemplateItem(auth.session.userId, id);
    if (!deleted) {
      return jsonError(NOT_FOUND, 404);
    }

    return jsonOk({ ok: true });
  } catch (error) {
    return failRoute(error);
  }
}
