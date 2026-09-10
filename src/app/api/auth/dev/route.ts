import type { NextResponse } from "next/server";

import { failRoute, jsonError, jsonOk } from "@/lib/api/respond";
import { setSessionCookie } from "@/lib/auth/session";
import { upsertTelegramUser } from "@/lib/auth/upsert-user";
import { ensureInitialData } from "@/lib/seed";

const DEV_TELEGRAM_ID = -1;

export async function POST(): Promise<NextResponse> {
  if (process.env.NODE_ENV === "production") {
    return jsonError("Not found", 404);
  }

  try {
    const user = await upsertTelegramUser({
      id: DEV_TELEGRAM_ID,
      username: "dev",
      first_name: "Dev",
      language_code: "ru",
    });
    await ensureInitialData(user.id);
    await setSessionCookie({
      userId: user.id,
      telegramId: user.telegram_id,
    });

    return jsonOk({ user, dev: true });
  } catch (error) {
    return failRoute(error);
  }
}
