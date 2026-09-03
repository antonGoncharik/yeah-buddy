import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { LOAD_FAILED } from "@/lib/messages";
import { phaseMaxInputSchema, setPhaseMax } from "@/lib/workout/macros";

type RouteContext = {
  params: Promise<{ phaseId: string }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { phaseId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  const parsed = phaseMaxInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  try {
    const phaseMax = await setPhaseMax(
      auth.session.userId,
      phaseId,
      parsed.data,
    );
    return NextResponse.json({ phase_max: phaseMax });
  } catch (error) {
    if (error instanceof Error && error.message === "Фаза не найдена.") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
