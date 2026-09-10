import type { NextResponse } from "next/server";

import { failRoute, jsonOk, parseJsonSchema } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { createFood, listFoods } from "@/lib/food/store";
import { foodInputSchema, parseFoodListFilter } from "@/lib/foods";

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const filter = parseFoodListFilter(
    new URL(request.url).searchParams.get("filter"),
  );

  try {
    const foods = await listFoods(auth.session.userId, filter);
    return jsonOk({ foods });
  } catch (error) {
    return failRoute(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const parsed = await parseJsonSchema(request, foodInputSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const food = await createFood(auth.session.userId, parsed.data);
    return jsonOk({ food });
  } catch (error) {
    return failRoute(error);
  }
}
