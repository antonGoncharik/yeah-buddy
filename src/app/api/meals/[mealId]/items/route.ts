import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/require-session";
import { addMealItem, PastDayLockedError } from "@/lib/days";
import { LOAD_FAILED } from "@/lib/messages";

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Проверь поля." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Проверь поля." }, { status: 400 });
  }

  try {
    const item = await addMealItem(
      auth.session.userId,
      mealId,
      parsed.data.foodId,
      parsed.data.grams,
    );
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof PastDayLockedError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof Error && error.message === "Meal not found") {
      return NextResponse.json(
        { error: "Приём пищи не найден." },
        { status: 404 },
      );
    }

    if (error instanceof Error && error.message === "Food not found") {
      return NextResponse.json(
        { error: "Продукт не найден." },
        { status: 404 },
      );
    }

    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
