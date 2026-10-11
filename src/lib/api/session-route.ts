import type { NextRequest, NextResponse } from "next/server";

import { failRoute } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import type { SessionPayload } from "@/lib/auth/session";

type RouteFailure = (error: unknown) => NextResponse | null;

/** Second argument Next passes to an App Router handler. */
type SessionRouteContext = {
  params?: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Auth gate plus `failRoute`. Missing session is the same 401 as `requireSession`.
 * `context` is the route's own params object; Next always supplies that shape here.
 */
export function sessionRoute<C = SessionRouteContext>(
  handler: (
    session: SessionPayload,
    request: NextRequest,
    context: C,
  ) => Promise<NextResponse>,
  errors?: RouteFailure[],
): (
  request: NextRequest,
  context: SessionRouteContext,
) => Promise<NextResponse> {
  return async (request, context) => {
    const auth = await requireSession();
    if ("response" in auth) {
      return auth.response;
    }

    try {
      return await handler(auth.session, request, context as C);
    } catch (error) {
      return failRoute(error, errors);
    }
  };
}
