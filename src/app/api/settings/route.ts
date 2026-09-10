import type { NextResponse } from "next/server";

import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import {
  getUserSettings,
  saveUserSettings,
  settingsInputSchema,
} from "@/lib/settings";

export async function GET(): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const settings = await getUserSettings(auth.session.userId);
    if (!settings) {
      return jsonError("Настройки не нашлись.", 404);
    }

    return jsonOk({ settings });
  } catch (error) {
    return failRoute(error);
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const parsed = await parseJsonSchema(request, settingsInputSchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const settings = await saveUserSettings(auth.session.userId, parsed.data);
    return jsonOk({ settings });
  } catch (error) {
    return failRoute(error);
  }
}
