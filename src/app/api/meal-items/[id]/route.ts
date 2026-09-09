import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/require-session";
import {
  deleteMealItem,
  getDateForMeal,
  getMealItem,
  PastDayLockedError,
  updateMealItemGrams,
} from "@/lib/days";
import { LOAD_FAILED } from "@/lib/messages";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const patchSchema = z.object({
  grams: z.number().finite().positive(),
});

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
    const item = await getMealItem(auth.session.userId, id);
    if (!item) {
      return NextResponse.json(
        { error: "Запись не найдена." },
        { status: 404 },
      );
    }

    const date = await getDateForMeal(auth.session.userId, item.meal_id);

    return NextResponse.json({ item, date });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Проверь поля." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Проверь поля." }, { status: 400 });
  }

  try {
    const item = await updateMealItemGrams(
      auth.session.userId,
      id,
      parsed.data.grams,
    );
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof PastDayLockedError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof Error && error.message === "Meal item not found") {
      return NextResponse.json(
        { error: "Запись не найдена." },
        { status: 404 },
      );
    }

    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
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
    const deleted = await deleteMealItem(auth.session.userId, id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Запись не найдена." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof PastDayLockedError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
