import { NextResponse } from "next/server";
import { z } from "zod";

import { setSessionCookie } from "@/lib/auth/session";
import { upsertTelegramUser } from "@/lib/auth/upsert-user";
import { getServerEnv } from "@/lib/env";
import { LOAD_FAILED, OPEN_VIA_BOT } from "@/lib/messages";
import { ensureInitialData } from "@/lib/seed";
import { verifyTelegramInitData } from "@/lib/telegram/verify-init-data";

const bodySchema = z.object({
  initData: z.string().min(1),
});

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(OPEN_VIA_BOT, 401);
  }

  const parsedBody = bodySchema.safeParse(body);
  if (!parsedBody.success) {
    return jsonError(OPEN_VIA_BOT, 401);
  }

  let env: ReturnType<typeof getServerEnv>;
  try {
    env = getServerEnv();
  } catch (error) {
    console.error(error);
    return jsonError(LOAD_FAILED, 500);
  }

  const telegramUser = verifyTelegramInitData(
    parsedBody.data.initData,
    env.TELEGRAM_BOT_TOKEN,
  );
  if (!telegramUser) {
    return jsonError(OPEN_VIA_BOT, 401);
  }

  try {
    const user = await upsertTelegramUser(telegramUser);
    await ensureInitialData(user.id);
    await setSessionCookie({
      userId: user.id,
      telegramId: user.telegram_id,
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error(error);
    return jsonError(LOAD_FAILED, 500);
  }
}

function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status });
}
