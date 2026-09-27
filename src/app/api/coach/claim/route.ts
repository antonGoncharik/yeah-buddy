import type { NextResponse } from "next/server";
import { z } from "zod";

import {
  failRoute,
  jsonOk,
  parseJsonSchema,
  whenError,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import {
  CoachNotFoundError,
  CoachOwnError,
  CoachTakenError,
} from "@/lib/coach/errors";
import { readCoachToken } from "@/lib/coach/start";
import { claimCoachGrant } from "@/lib/coach/store";

const bodySchema = z.object({
  token: z.string().trim().min(1).max(80),
});

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const parsed = await parseJsonSchema(
    request,
    bodySchema,
    (data) => readCoachToken(data.token) != null,
  );
  if (!parsed.ok) {
    return parsed.response;
  }

  const token = readCoachToken(parsed.data.token);
  if (!token) {
    return failRoute(new CoachNotFoundError(), [
      whenError(CoachNotFoundError, 404),
    ]);
  }

  try {
    return jsonOk(await claimCoachGrant(auth.session.userId, token));
  } catch (error) {
    return failRoute(error, [
      whenError(CoachNotFoundError, 404),
      whenError(CoachOwnError, 409),
      whenError(CoachTakenError, 409),
    ]);
  }
}
