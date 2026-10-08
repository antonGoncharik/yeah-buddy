import type { NextResponse } from "next/server";

import { failRoute, jsonError, jsonOk } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { deleteMealChatDraft, readMealChatDraft } from "@/lib/meal-chat/store";
import { NOT_FOUND } from "@/lib/messages";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;
  try {
    const draft = await readMealChatDraft(auth.session.userId, id);
    if (!draft) {
      return jsonError(NOT_FOUND, 404);
    }

    return jsonOk({
      mealId: draft.mealId,
      date: draft.date,
      items: draft.items,
    });
  } catch (error) {
    return failRoute(error, []);
  }
}

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
    await deleteMealChatDraft(auth.session.userId, id);
    return jsonOk({ ok: true });
  } catch (error) {
    return failRoute(error, []);
  }
}
