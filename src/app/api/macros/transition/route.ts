import type { NextResponse } from "next/server";

import {
  failRoute,
  jsonOk,
  parseJsonSchema,
  whenMessage,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import {
  confirmTransition,
  confirmTransitionSchema,
  previewTransition,
} from "@/lib/workout/macros";

export async function GET(): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const preview = await previewTransition(auth.session.userId);
    return jsonOk({ preview });
  } catch (error) {
    return failRoute(error, [whenMessage("Нет текущего этапа.", 409)]);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const parsed = await parseJsonSchema(request, confirmTransitionSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const state = await confirmTransition(auth.session.userId, parsed.data);
    return jsonOk(state);
  } catch (error) {
    return failRoute(error, [
      whenMessage("Нет текущего этапа.", 409),
      whenMessage("Нет текущего цикла.", 409),
      whenMessage("Новый цикл начинается после последнего этапа.", 409),
      whenMessage("Сначала упражнения.", 409),
    ]);
  }
}
