import type { NextResponse } from "next/server";

import { failRoute, jsonOk } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { searchCatalogExercises } from "@/lib/workout/exercise-catalog-store";

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const query = new URL(request.url).searchParams.get("q") ?? "";

  try {
    const exercises = await searchCatalogExercises(query);
    return jsonOk({ exercises });
  } catch (error) {
    return failRoute(error);
  }
}
