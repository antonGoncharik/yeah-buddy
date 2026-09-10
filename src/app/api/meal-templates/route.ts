import type { NextResponse } from "next/server";

import { failRoute, jsonOk } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { listMealTemplates } from "@/lib/meal-templates";

export async function GET(): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const templates = await listMealTemplates(auth.session.userId);
    return jsonOk({ templates });
  } catch (error) {
    return failRoute(error);
  }
}
