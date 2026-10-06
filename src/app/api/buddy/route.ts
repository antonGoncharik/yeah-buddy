import type { NextResponse } from "next/server";

import { failRoute, jsonOk, whenError } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { BuddyLimitError, BuddyShareError } from "@/lib/buddy/errors";
import { issueBuddyLink, loadBuddyHome } from "@/lib/buddy/store";

export async function GET(): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    return jsonOk(await loadBuddyHome(auth.session.userId));
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
    return jsonOk(await issueBuddyLink(auth.session.userId));
  } catch (error) {
    return failRoute(error, [
      whenError(BuddyLimitError, 409),
      whenError(BuddyShareError, 503),
    ]);
  }
}
