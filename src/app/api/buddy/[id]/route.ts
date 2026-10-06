import type { NextResponse } from "next/server";

import { failRoute, jsonOk, whenError } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { loadBuddyBoard } from "@/lib/buddy/board";
import { BuddyNotFoundError } from "@/lib/buddy/errors";
import { isBuddyGrantId } from "@/lib/buddy/id";
import { revokeBuddyGrant } from "@/lib/buddy/store";

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
  if (!isBuddyGrantId(id)) {
    return failRoute(new BuddyNotFoundError(), [
      whenError(BuddyNotFoundError, 404),
    ]);
  }

  try {
    const board = await loadBuddyBoard(auth.session.userId, id);
    return jsonOk({ board });
  } catch (error) {
    return failRoute(error, [whenError(BuddyNotFoundError, 404)]);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await context.params;
  if (!isBuddyGrantId(id)) {
    return failRoute(new BuddyNotFoundError(), [
      whenError(BuddyNotFoundError, 404),
    ]);
  }

  try {
    await revokeBuddyGrant(auth.session.userId, id);
    return jsonOk({ ok: true });
  } catch (error) {
    return failRoute(error, [whenError(BuddyNotFoundError, 404)]);
  }
}
