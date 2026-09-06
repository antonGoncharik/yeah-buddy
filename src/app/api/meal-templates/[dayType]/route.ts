import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { ensureMealTemplate, isDayType } from "@/lib/meal-templates";
import { LOAD_FAILED } from "@/lib/messages";

type RouteContext = {
  params: Promise<{ dayType: string }>;
};

export async function GET(
  _request: Request,
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

  try {
    const template = await ensureMealTemplate(auth.session.userId, dayType);
    return NextResponse.json({ template });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
