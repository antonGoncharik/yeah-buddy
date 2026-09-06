import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import {
  addTemplateItem,
  FoodNotFoundError,
  isDayType,
  TemplateMealHiddenError,
  templateItemWriteSchema,
} from "@/lib/meal-templates";
import { LOAD_FAILED } from "@/lib/messages";

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
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  const parsed = templateItemWriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  try {
    const item = await addTemplateItem(
      auth.session.userId,
      dayType,
      parsed.data,
    );
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof TemplateMealHiddenError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof FoodNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
