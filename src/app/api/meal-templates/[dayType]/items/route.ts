import type { NextResponse } from "next/server";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenError,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import {
  addTemplateItem,
  FoodNotFoundError,
  reorderTemplateItems,
  TemplateMealHiddenError,
  templateItemReorderSchema,
  templateItemWriteSchema,
} from "@/lib/meal-templates";
import { CHECK_FIELDS } from "@/lib/messages";
import { isDayType } from "@/lib/nutrition";
import { OrderMismatchError } from "@/lib/order";

type RouteContext = {
  params: Promise<{ dayType: string }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { dayType } = await context.params;
  if (!isDayType(dayType)) {
    return jsonError(CHECK_FIELDS, 400);
  }

  const parsed = await parseJsonSchema(request, templateItemWriteSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const item = await addTemplateItem(
      auth.session.userId,
      dayType,
      parsed.data,
    );
    return jsonOk({ item });
  } catch (error) {
    return failRoute(error, [
      whenError(TemplateMealHiddenError, 400),
      whenError(FoodNotFoundError, 404),
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

  const { dayType } = await context.params;
  if (!isDayType(dayType)) {
    return jsonError(CHECK_FIELDS, 400);
  }

  const parsed = await parseJsonSchema(request, templateItemReorderSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const template = await reorderTemplateItems(
      auth.session.userId,
      dayType,
      parsed.data.mealType,
      parsed.data.itemIds,
    );
    return jsonOk({ template });
  } catch (error) {
    return failRoute(error, [
      whenError(TemplateMealHiddenError, 400),
      whenError(OrderMismatchError, 400),
    ]);
  }
}
