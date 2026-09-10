import type { NextResponse } from "next/server";

import { failRoute, jsonOk, readHistoryQuery } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { listSessionHistory } from "@/lib/workout/sessions";

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const query = readHistoryQuery(request);
  if (!query.ok) {
    return query.response;
  }

  try {
    const page = await listSessionHistory(auth.session.userId, {
      before: query.before,
      limit: query.limit,
    });
    return jsonOk(page);
  } catch (error) {
    return failRoute(error);
  }
}
