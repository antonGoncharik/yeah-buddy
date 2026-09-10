import type { NextResponse } from "next/server";

import { jsonError, jsonOk } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { CHECK_FIELDS, LOAD_FAILED } from "@/lib/messages";
import {
  completeSessionAsPlanned,
  completeSessionSchema,
} from "@/lib/workout/session-work";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parsed = completeSessionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(CHECK_FIELDS, 400);
  }

  try {
    const detail = await completeSessionAsPlanned(
      auth.session.userId,
      id,
      parsed.data,
    );
    if (!detail) {
      return jsonError("Тренировка не найдена.", 404);
    }

    return jsonOk(detail);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : LOAD_FAILED;
    return jsonError(message, 400);
  }
}
