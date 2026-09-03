import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/require-session";
import { setDayType } from "@/lib/days";
import { LOAD_FAILED } from "@/lib/messages";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const bodySchema = z.object({
  dayType: z.enum(["rest", "training"]),
});

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

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  try {
    const day = await setDayType(auth.session.userId, id, parsed.data.dayType);
    return NextResponse.json({ day });
  } catch (error) {
    if (error instanceof Error && error.message === "Day not found") {
      return NextResponse.json({ error: "День не найден." }, { status: 404 });
    }

    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
