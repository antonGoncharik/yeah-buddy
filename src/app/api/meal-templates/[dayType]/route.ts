import type { NextResponse } from "next/server";

import { failRoute, jsonError, jsonOk } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { ensureMealTemplate } from "@/lib/meal-templates";
import { CHECK_FIELDS } from "@/lib/messages";
import { isDayType } from "@/lib/nutrition";

type RouteContext = {
  params: Promise<{ dayType: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { dayType } = await context.params;
  if (!isDayType(dayType)) {
    return jsonError(CHECK_FIELDS, 400);
  }

  try {
    const template = await ensureMealTemplate(auth.session.userId, dayType);
    return jsonOk({ template });
  } catch (error) {
    return failRoute(error);
  }
}
