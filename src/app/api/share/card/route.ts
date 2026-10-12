import { NextResponse } from "next/server";

import { rateLimitIp } from "@/lib/api/rate-limit";
import { getServerEnv } from "@/lib/env";
import { renderShareCardJpeg } from "@/lib/share/share-card-jpeg";
import { WEEK_CARD_QUERY_LIMIT } from "@/lib/share/week-card";

export async function GET(request: Request): Promise<NextResponse> {
  const limited = rateLimitIp(request, "share_card", 10, 60_000);
  if (limited) {
    return limited;
  }

  const query = new URL(request.url).searchParams.get("q");
  if (!query || query.length > WEEK_CARD_QUERY_LIMIT) {
    return new NextResponse(null, { status: 404 });
  }

  const secret = getServerEnv().SESSION_SECRET;

  try {
    const jpeg = await renderShareCardJpeg(query, secret);
    if (!jpeg) {
      return new NextResponse(null, { status: 404 });
    }
    return new NextResponse(new Uint8Array(jpeg), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse(null, { status: 404 });
  }
}
