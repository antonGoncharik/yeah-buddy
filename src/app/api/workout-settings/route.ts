import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { LOAD_FAILED } from "@/lib/messages";
import {
  ensureWorkoutSettings,
  saveWorkoutSettings,
  workoutSettingsPatchSchema,
} from "@/lib/workout/settings";

export async function GET(): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const settings = await ensureWorkoutSettings(auth.session.userId);
    return NextResponse.json({
      settings: {
        weight_step: settings.weight_step,
        max_increase_percent: settings.max_increase_percent,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
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

  const parsed = workoutSettingsPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  try {
    const settings = await saveWorkoutSettings(
      auth.session.userId,
      parsed.data,
    );
    return NextResponse.json({
      settings: {
        weight_step: settings.weight_step,
        max_increase_percent: settings.max_increase_percent,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
