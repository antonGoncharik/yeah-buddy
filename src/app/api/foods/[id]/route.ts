import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { deleteFood, getFood, updateFood } from "@/lib/food/store";
import { foodInputSchema } from "@/lib/foods";
import { LOAD_FAILED } from "@/lib/messages";

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
      return NextResponse.json({ error: FOOD_NOT_FOUND }, { status: 404 });
    }

    return NextResponse.json({ food });
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

  const parsed = foodInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Проверь поля." }, { status: 400 });
  }

  try {
    const food = await updateFood(auth.session.userId, id, parsed.data);
    if (!food) {
      return NextResponse.json({ error: FOOD_NOT_FOUND }, { status: 404 });
    }

    return NextResponse.json({ food });
  } catch (error) {
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
    const deleted = await deleteFood(auth.session.userId, id);
    if (!deleted) {
      return NextResponse.json({ error: FOOD_NOT_FOUND }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
