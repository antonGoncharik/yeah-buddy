import type { NextResponse } from "next/server";

import { failRoute, jsonOk, whenError, whenMessage } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import {
  DayTemplateEmptyError,
  saveDayAsMealTemplate,
} from "@/lib/day/save-template";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;

  try {
    const result = await saveDayAsMealTemplate(auth.session.userId, id);
    return jsonOk(result);
  } catch (error) {
    return failRoute(error, [
      whenError(DayTemplateEmptyError, 400),
      whenMessage("Day not found", 404, "День не найден."),
    ]);
  }
}
