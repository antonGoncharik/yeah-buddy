import type { NextResponse } from "next/server";

import { failRoute, jsonOk, parseJsonSchema } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createExercise,
  exerciseCreateSchema,
  listExercises,
} from "@/lib/workout/exercises";
import { ensureStarterExercises } from "@/lib/workout/seed";
import { ensureWorkoutSettings } from "@/lib/workout/settings";

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const filterParam = new URL(request.url).searchParams.get("filter");
  const filter =
    filterParam === "archived" || filterParam === "all"
      ? filterParam
      : "active";

  try {
    await ensureWorkoutSettings(auth.session.userId);
    await ensureStarterExercises(
      createSupabaseServerClient(),
      auth.session.userId,
    );
    const exercises = await listExercises(auth.session.userId, filter);
    return jsonOk({ exercises });
  } catch (error) {
    return failRoute(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const parsed = await parseJsonSchema(request, exerciseCreateSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    await ensureWorkoutSettings(auth.session.userId);
    await ensureStarterExercises(
      createSupabaseServerClient(),
      auth.session.userId,
    );
    const exercise = await createExercise(auth.session.userId, parsed.data);
    return jsonOk({ exercise });
  } catch (error) {
    return failRoute(error);
  }
}
