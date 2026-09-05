import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/require-session";
import { isIsoDate } from "@/lib/days";
import { LOAD_FAILED } from "@/lib/messages";
import { listSessionHistory } from "@/lib/workout/sessions";

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const params = new URL(request.url).searchParams;
  const before = params.get("before");
  const limitRaw = params.get("limit");
  const limit = limitRaw ? Number(limitRaw) : 30;

  if (before && !isIsoDate(before)) {
    return NextResponse.json({ error: "Некорректная дата." }, { status: 400 });
  }

  if (!Number.isFinite(limit) || limit < 1) {
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  try {
    const page = await listSessionHistory(auth.session.userId, {
      before: before ?? undefined,
      limit,
    });
    return NextResponse.json(page);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
