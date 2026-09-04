import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { isIsoDate } from "@/lib/days";
import { LOAD_FAILED } from "@/lib/messages";
import {
  createSession,
  createSessionSchema,
  getTodayWorkoutState,
  SessionConflictError,
} from "@/lib/workout/sessions";
import { TemplateNotFoundError } from "@/lib/workout/templates";

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const date = new URL(request.url).searchParams.get("date");
  if (!date || !isIsoDate(date)) {
    return NextResponse.json({ error: "Некорректная дата." }, { status: 400 });
  }

  try {
    const today = await getTodayWorkoutState(auth.session.userId, date);
    return NextResponse.json(today);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
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

  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  try {
    const session = await createSession(auth.session.userId, parsed.data);
    return NextResponse.json({ session });
  } catch (error) {
    if (
      error instanceof SessionConflictError ||
      error instanceof TemplateNotFoundError
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
