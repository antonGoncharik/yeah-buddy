import type { NextRequest, NextResponse } from "next/server";

import { failRoute, jsonOk } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import {
  getMuscleSnapshot,
  parseMuscleHorizonDays,
} from "@/lib/workout/muscle-load";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const days = parseMuscleHorizonDays(request.nextUrl.searchParams.get("days"));

  try {
    const snapshot = await getMuscleSnapshot(auth.session.userId, days);
    return jsonOk(snapshot);
  } catch (error) {
    return failRoute(error);
  }
}
