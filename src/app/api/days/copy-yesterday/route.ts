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
  copyYesterday,
  DayConflictError,
  isIsoDate,
  PastDayLockedError,
  YesterdayMissingError,
} from "@/lib/days";

const bodySchema = z.object({
  date: z.string(),
  replace: z.boolean().optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const parsed = await parseJsonSchema(request, bodySchema, (data) =>
    isIsoDate(data.date),
  );
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const day = await copyYesterday(
      auth.session.userId,
      parsed.data.date,
      parsed.data.replace ?? false,
    );
    return jsonOk({ day });
  } catch (error) {
    return failRoute(error, [
      whenError(PastDayLockedError, 409),
      whenError(YesterdayMissingError, 404),
      (err) =>
        err instanceof DayConflictError
          ? jsonError(err.message, 409, { code: err.code })
          : null,
    ]);
  }
}
