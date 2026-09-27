import type { NextResponse } from "next/server";

import { failRoute, jsonOk, whenError } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { CoachLimitError, CoachShareError } from "@/lib/coach/errors";
import { issueCoachLink, loadCoachHome } from "@/lib/coach/store";

export async function GET(): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    return jsonOk(await loadCoachHome(auth.session.userId));
  } catch (error) {
    return failRoute(error);
  }
}

export async function POST(): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    return jsonOk(await issueCoachLink(auth.session.userId));
  } catch (error) {
    return failRoute(error, [
      whenError(CoachLimitError, 409),
      whenError(CoachShareError, 503),
    ]);
  }
}
