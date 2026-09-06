import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import {
  deleteTemplateItem,
  FoodNotFoundError,
  getTemplateItem,
  MealTemplateItemNotFoundError,
  templateItemGramsSchema,
  updateTemplateItemGrams,
} from "@/lib/meal-templates";
import { LOAD_FAILED } from "@/lib/messages";

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
      return NextResponse.json(
        { error: "Запись не найдена." },
        { status: 404 },
      );
    }

    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof FoodNotFoundError) {
      return NextResponse.json(
        { error: "Запись не найдена." },
        { status: 404 },
      );
    }

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
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  const parsed = templateItemGramsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  try {
    const item = await updateTemplateItemGrams(
      auth.session.userId,
      id,
      parsed.data.grams,
    );
    return NextResponse.json({ item });
  } catch (error) {
    if (
      error instanceof MealTemplateItemNotFoundError ||
      error instanceof FoodNotFoundError
    ) {
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
    const deleted = await deleteTemplateItem(auth.session.userId, id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Запись не найдена." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
