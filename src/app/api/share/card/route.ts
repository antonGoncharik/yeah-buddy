import { NextResponse } from "next/server";

import { getServerEnv } from "@/lib/env";
import {
  decodeMuscleWeekCard,
  muscleWeekCardSvg,
} from "@/lib/share/muscle-week-card";
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
  const muscleWeek = sunday ? null : decodeMuscleWeekCard(query, secret);
  const week = sunday || muscleWeek ? null : decodeWeekCard(query, secret);
  if (!sunday && !week && !muscleWeek) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const jpeg = sunday
      ? await renderShareSvgJpeg(sundayCardSvg(sunday))
      : muscleWeek
        ? await renderShareSvgJpeg(muscleWeekCardSvg(muscleWeek))
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
