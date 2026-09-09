import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { setFoodFavorite } from "@/lib/food/store";
import { foodFavoriteSchema } from "@/lib/foods";
import { LOAD_FAILED } from "@/lib/messages";

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Проверь поля." }, { status: 400 });
  }

  const parsed = foodFavoriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Проверь поля." }, { status: 400 });
  }

  try {
    const food = await setFoodFavorite(
      auth.session.userId,
      id,
      parsed.data.is_favorite,
    );
    if (!food) {
      return NextResponse.json(
        { error: "Продукт не найден." },
        { status: 404 },
      );
    }

    return NextResponse.json({ food });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
