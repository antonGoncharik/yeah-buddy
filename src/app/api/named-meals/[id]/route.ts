import type { NextResponse } from "next/server";

import { failRoute, jsonError, jsonOk, whenMessage } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { NOT_FOUND } from "@/lib/messages";
import { deleteNamedMeal } from "@/lib/named-meal/store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;

  try {
    const deleted = await deleteNamedMeal(auth.session.userId, id);
    if (!deleted) {
      return jsonError(NOT_FOUND, 404);
    }
    return jsonOk({ ok: true });
  } catch (error) {
    return failRoute(error, [whenMessage("Meal not found", 404, NOT_FOUND)]);
  }
}
