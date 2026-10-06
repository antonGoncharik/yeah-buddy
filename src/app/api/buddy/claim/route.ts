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
  BuddyNotFoundError,
  BuddyOwnError,
  BuddyTakenError,
} from "@/lib/buddy/errors";
import { readBuddyToken } from "@/lib/buddy/start";
import { claimBuddyGrant } from "@/lib/buddy/store";

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
    (data) => readBuddyToken(data.token) != null,
  );
  if (!parsed.ok) {
    return parsed.response;
  }

  const token = readBuddyToken(parsed.data.token);
  if (!token) {
    return failRoute(new BuddyNotFoundError(), [
      whenError(BuddyNotFoundError, 404),
    ]);
  }

  try {
    return jsonOk(await claimBuddyGrant(auth.session.userId, token));
  } catch (error) {
    return failRoute(error, [
      whenError(BuddyNotFoundError, 404),
      whenError(BuddyOwnError, 409),
      whenError(BuddyTakenError, 409),
    ]);
  }
}
