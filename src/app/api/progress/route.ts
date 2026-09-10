import type { NextResponse } from "next/server";

import { failRoute, jsonOk } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { getStrengthProgress } from "@/lib/workout/progress";

export async function GET(): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const progress = await getStrengthProgress(auth.session.userId);
    return jsonOk(progress);
  } catch (error) {
    return failRoute(error);
  }
}
