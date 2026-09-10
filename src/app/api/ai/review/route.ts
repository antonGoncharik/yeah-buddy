import type { NextResponse } from "next/server";
import { z } from "zod";
import { ReviewError, reviewStatus } from "@/lib/ai/errors";
import {
  createReview,
  getReviewSnapshot,
  parseReviewRange,
} from "@/lib/ai/review";
import {
  failRoute,
  jsonError,
  jsonOk,
  parseJsonSchema,
} from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { CHECK_FIELDS } from "@/lib/messages";

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
    return jsonError(CHECK_FIELDS, 400);
  }

  try {
    const snapshot = await getReviewSnapshot(auth.session.userId, days);
    return jsonOk(snapshot);
  } catch (error) {
    return failRoute(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  const parsed = await parseJsonSchema(request, bodySchema);
  if (!parsed.ok) {
    return parsed.response;
  }

  try {
    const snapshot = await createReview(auth.session.userId, parsed.data.days);
    return jsonOk(snapshot);
  } catch (error) {
    return failRoute(error, [
      (err) =>
        err instanceof ReviewError
          ? jsonError(err.message, reviewStatus(err.code))
          : null,
    ]);
  }
}
