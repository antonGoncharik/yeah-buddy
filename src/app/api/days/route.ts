import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/require-session";
import {
  createDayFromTemplate,
  DayConflictError,
  dateHasDay,
  getDayByDate,
  isIsoDate,
  previousIsoDate,
} from "@/lib/days";
import { LOAD_FAILED } from "@/lib/messages";

const createSchema = z.object({
  date: z.string(),
  dayType: z.enum(["rest", "training"]),
});

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const date = new URL(request.url).searchParams.get("date") ?? "";
  if (!isIsoDate(date)) {
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  try {
    const [day, yesterdayExists] = await Promise.all([
      getDayByDate(auth.session.userId, date),
      dateHasDay(auth.session.userId, previousIsoDate(date)),
    ]);

    return NextResponse.json({ day, yesterdayExists });
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

  const parsed = createSchema.safeParse(body);
  if (!parsed.success || !isIsoDate(parsed.data.date)) {
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  try {
    const day = await createDayFromTemplate(
      auth.session.userId,
      parsed.data.date,
      parsed.data.dayType,
    );
    return NextResponse.json({ day });
  } catch (error) {
    if (error instanceof DayConflictError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 409 },
      );
    }

    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
