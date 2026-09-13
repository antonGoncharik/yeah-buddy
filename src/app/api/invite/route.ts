import type { NextResponse } from "next/server";

import { failRoute, jsonError, jsonOk } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { APP_SHARE_TEXT } from "@/lib/brand";
import { LOAD_FAILED } from "@/lib/messages";
import { getAppShareUrl } from "@/lib/telegram/bot";

export async function GET(): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const url = await getAppShareUrl();
    if (!url) {
      return jsonError(LOAD_FAILED, 404);
    }

    return jsonOk({ url, text: APP_SHARE_TEXT });
  } catch (error) {
    return failRoute(error);
  }
}
