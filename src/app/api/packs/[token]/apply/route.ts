import type { NextResponse } from "next/server";

import { failRoute, jsonOk, whenError } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import {
  applyPack,
  PackEmptyError,
  PackLimitError,
  PackNotFoundError,
} from "@/lib/share/packs";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function POST(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { token } = await context.params;

  try {
    const pack = await applyPack(auth.session.userId, token);
    return jsonOk({ pack });
  } catch (error) {
    return failRoute(error, [
      whenError(PackNotFoundError, 404),
      whenError(PackEmptyError, 400),
      whenError(PackLimitError, 400),
    ]);
  }
}
