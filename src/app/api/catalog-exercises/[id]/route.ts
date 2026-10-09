import type { NextResponse } from "next/server";

import { failRoute, jsonError, jsonOk } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { getCatalogExercise } from "@/lib/workout/exercise-catalog-store";

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
    const exercise = await getCatalogExercise(id);
    if (!exercise) {
      return jsonError("Упражнение не найдено в каталоге.", 404);
    }

    return jsonOk({ exercise });
  } catch (error) {
    return failRoute(error);
  }
}
