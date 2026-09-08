import { NextResponse } from "next/server";
import { z } from "zod";
import { ReviewError, reviewStatus } from "@/lib/ai/errors";
import {
  createReview,
  getReviewSnapshot,
  parseReviewRange,
} from "@/lib/ai/review";
import { requireSession } from "@/lib/auth/require-session";
import { LOAD_FAILED } from "@/lib/messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  days: z.union([z.literal(14), z.literal(30)]),
});

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const days = parseReviewRange(
    new URL(request.url).searchParams.get("days") ?? "14",
  );
  if (!days) {
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  try {
    const snapshot = await getReviewSnapshot(auth.session.userId, days);
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте поля формы." },
      { status: 400 },
    );
  }

  try {
    const snapshot = await createReview(auth.session.userId, parsed.data.days);
    return NextResponse.json(snapshot);
  } catch (error) {
    if (error instanceof ReviewError) {
      return NextResponse.json(
        { error: error.message },
        { status: reviewStatus(error.code) },
      );
    }

    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
