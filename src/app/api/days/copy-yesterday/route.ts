import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth/require-session";
import {
  copyYesterday,
  DayConflictError,
  isIsoDate,
  YesterdayMissingError,
} from "@/lib/days";
import { LOAD_FAILED } from "@/lib/messages";

const bodySchema = z.object({
  date: z.string(),
  replace: z.boolean().optional(),
});

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

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success || !isIsoDate(parsed.data.date)) {
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  try {
    const day = await copyYesterday(
      auth.session.userId,
      parsed.data.date,
      parsed.data.replace ?? false,
    );
    return NextResponse.json({ day });
  } catch (error) {
    if (error instanceof YesterdayMissingError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

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
