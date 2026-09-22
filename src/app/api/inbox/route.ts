import type { NextResponse } from "next/server";

import { failRoute, jsonOk } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth/require-session";
import { getServerEnv } from "@/lib/env";
import { readInboxChatId } from "@/lib/inbox/letter";
import { getInboxOpenUrl } from "@/lib/telegram/bot";

export async function GET(): Promise<NextResponse> {
  const auth = await requireSession();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const adminId = readInboxChatId(getServerEnv().INBOX_CHAT_ID);
    if (adminId == null || adminId === auth.session.telegramId) {
      return jsonOk({ url: null });
    }

    const url = await getInboxOpenUrl();
    return jsonOk({ url });
  } catch (error) {
    return failRoute(error);
  }
}
