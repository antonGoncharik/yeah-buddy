import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { LOAD_FAILED, PACK_NOT_FOUND } from "@/lib/messages";
import { getPackDetail, PackNotFoundError } from "@/lib/share/packs";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const { token } = await context.params;

  try {
    const pack = await getPackDetail(auth.session.userId, token);
    return NextResponse.json({ pack });
  } catch (error) {
    if (error instanceof PackNotFoundError) {
      return NextResponse.json({ error: PACK_NOT_FOUND }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
