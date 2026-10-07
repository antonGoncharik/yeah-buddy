import { NextResponse } from "next/server";

import { getServerEnv } from "@/lib/env";
import { decodeSundayCard, sundayCardSvg } from "@/lib/share/sunday-card";
import { decodeWeekCard } from "@/lib/share/week-card";
import {
  renderShareSvgJpeg,
  renderWeekCardJpeg,
} from "@/lib/share/week-card-image";

export async function GET(request: Request): Promise<NextResponse> {
  const query = new URL(request.url).searchParams.get("q");
  if (!query) {
    return new NextResponse(null, { status: 404 });
  }

  const secret = getServerEnv().SESSION_SECRET;
  const sunday = decodeSundayCard(query, secret);
  const week = sunday ? null : decodeWeekCard(query, secret);
  if (!sunday && !week) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const jpeg = sunday
      ? await renderShareSvgJpeg(sundayCardSvg(sunday))
      : week
        ? await renderWeekCardJpeg(week)
        : null;
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
