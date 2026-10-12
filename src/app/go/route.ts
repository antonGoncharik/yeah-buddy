import { NextResponse } from "next/server";

import { trackLandingCtaClick } from "@/lib/analytics/landing-cta";
import { getServerEnv } from "@/lib/env";
import { landingStartPayload } from "@/lib/telegram/landing-start";
import { publicBotChatUrl } from "@/lib/telegram/public-bot-url";

const SRC_PATTERN = /^[a-z0-9_-]{1,32}$/;

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const rawSrc = url.searchParams.get("src")?.trim().toLowerCase() ?? "cta";
  const src = SRC_PATTERN.test(rawSrc) ? rawSrc : "cta";

  await trackLandingCtaClick(src);

  const botUrl = publicBotChatUrl(getServerEnv(), landingStartPayload(src));
  if (!botUrl) {
    return NextResponse.redirect(new URL("/", url.origin), 302);
  }

  return NextResponse.redirect(botUrl, 302);
}
