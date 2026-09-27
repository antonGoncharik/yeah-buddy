import { NextResponse } from "next/server";

import { getServerEnv } from "@/lib/env";
import { decodeWeekCard } from "@/lib/share/week-card";
import { renderWeekCardJpeg } from "@/lib/share/week-card-image";

export async function GET(request: Request): Promise<NextResponse> {
  const query = new URL(request.url).searchParams.get("q");
  if (!query) {
    return new NextResponse(null, { status: 404 });
  }

  const card = decodeWeekCard(query, getServerEnv().SESSION_SECRET);
  if (!card) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const jpeg = await renderWeekCardJpeg(card);
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
