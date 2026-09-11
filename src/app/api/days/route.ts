import type { NextResponse } from "next/server";
import { z } from "zod";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
  whenError,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import {
  createDayFromTemplate,
  DayConflictError,
  getDayByDate,
  getLastBodyWeight,
  isIsoDate,
  PastDayLockedError,
  yesterdayCopyHint,
} from "@/lib/days";
import { CHECK_FIELDS } from "@/lib/messages";

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
    return jsonError(CHECK_FIELDS, 400);
  }

  try {
    const [day, yesterday, lastBodyWeight] = await Promise.all([
      getDayByDate(auth.session.userId, date),
      yesterdayCopyHint(auth.session.userId, date),
      getLastBodyWeight(auth.session.userId, date),
    ]);

    return jsonOk({
      day,
      yesterdayExists: yesterday.exists,
      yesterdayMealTypes: yesterday.mealTypes,
      lastBodyWeight,
    });
  } catch (error) {
    return failRoute(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const parsed = await parseJsonSchema(request, createSchema, (data) =>
    isIsoDate(data.date),
  );
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const day = await createDayFromTemplate(
      auth.session.userId,
      parsed.data.date,
      parsed.data.dayType,
    );
    return jsonOk({ day });
  } catch (error) {
    return failRoute(error, [
      whenError(PastDayLockedError, 409),
      (err) =>
        err instanceof DayConflictError
          ? jsonError(err.message, 409, { code: err.code })
          : null,
    ]);
  }
}
