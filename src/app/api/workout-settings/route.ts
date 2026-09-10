import type { NextResponse } from "next/server";

import { failRoute, jsonOk, parseJsonSchema } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
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
    return jsonOk({
      settings: {
        max_increase_percent: settings.max_increase_percent,
        formulas: settings.formulas,
      },
    });
  } catch (error) {
    return failRoute(error);
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const parsed = await parseJsonSchema(request, workoutSettingsPatchSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const settings = await saveWorkoutSettings(
      auth.session.userId,
      parsed.data,
    );
    return jsonOk({
      settings: {
        max_increase_percent: settings.max_increase_percent,
        formulas: settings.formulas,
      },
    });
  } catch (error) {
    return failRoute(error);
  }
}
