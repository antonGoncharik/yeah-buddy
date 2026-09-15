import type { NextResponse } from "next/server";

import { failRoute, jsonOk, whenError } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import {
  CatalogFoodNotFoundError,
  copyCatalogFood,
} from "@/lib/food/catalog-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;

  try {
    const food = await copyCatalogFood(auth.session.userId, id);
    return jsonOk({ food });
  } catch (error) {
    return failRoute(error, [whenError(CatalogFoodNotFoundError, 404)]);
  }
}
