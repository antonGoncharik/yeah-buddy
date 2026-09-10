import type { NextResponse } from "next/server";

import { failRoute, jsonOk } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { unskipLastTemplate } from "@/lib/workout/settings";

export async function POST(): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    await unskipLastTemplate(auth.session.userId);
    return jsonOk({ ok: true });
  } catch (error) {
    return failRoute(error);
  }
}
