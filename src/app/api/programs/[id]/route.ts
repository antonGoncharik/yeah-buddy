import type { NextResponse } from "next/server";

import { failRoute, jsonOk, whenError } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import {
  FeaturedProgramNotFoundError,
  loadFeaturedProgramDetail,
} from "@/lib/share/program-load";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;

  try {
    const program = await loadFeaturedProgramDetail(auth.session.userId, id);
    return jsonOk({ program });
  } catch (error) {
    return failRoute(error, [whenError(FeaturedProgramNotFoundError, 404)]);
  }
}
