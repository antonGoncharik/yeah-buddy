import { NextResponse } from "next/server";

import { setSessionCookie } from "@/lib/auth/session";
import { upsertTelegramUser } from "@/lib/auth/upsert-user";
import { LOAD_FAILED } from "@/lib/messages";
import { ensureInitialData } from "@/lib/seed";

const DEV_TELEGRAM_ID = -1;

export async function POST(): Promise<NextResponse> {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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

    return NextResponse.json({ user, dev: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
