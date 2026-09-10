import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { LOAD_FAILED, PACK_NOT_FOUND } from "@/lib/messages";
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
    return NextResponse.json({ pack });
  } catch (error) {
    if (error instanceof PackNotFoundError) {
      return NextResponse.json({ error: PACK_NOT_FOUND }, { status: 404 });
    }
    if (error instanceof PackEmptyError || error instanceof PackLimitError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
