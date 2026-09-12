import type { NextResponse } from "next/server";

import { failRoute, jsonOk } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { listWeek } from "@/lib/day/week-load";

export async function GET(): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    return jsonOk(await listWeek(auth.session.userId));
  } catch (error) {
    return failRoute(error);
  }
}
