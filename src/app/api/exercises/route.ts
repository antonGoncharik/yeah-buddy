import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { LOAD_FAILED } from "@/lib/messages";
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
    return NextResponse.json({ exercises });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  const parsed = exerciseCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  try {
    await ensureWorkoutSettings(auth.session.userId);
    await ensureStarterExercises(
      createSupabaseServerClient(),
      auth.session.userId,
    );
    const exercise = await createExercise(auth.session.userId, parsed.data);
    return NextResponse.json({ exercise });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
