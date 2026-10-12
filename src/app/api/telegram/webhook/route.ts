import type { Update } from "grammy/types";
import { NextResponse } from "next/server";

import { getServerEnv } from "@/lib/env";
import { createBot } from "@/lib/telegram/bot";
import {
  isDuplicateTelegramUpdate,
  rememberTelegramUpdate,
} from "@/lib/telegram/update-dedup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const env = getServerEnv();
  const secret = request.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: unknown;
  try {
    update = await request.json();
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: true });
  }

  const updateId =
    update && typeof update === "object" && "update_id" in update
      ? Number(Reflect.get(update, "update_id"))
      : NaN;
  if (Number.isInteger(updateId) && isDuplicateTelegramUpdate(updateId)) {
    return NextResponse.json({ ok: true });
  }
  if (Number.isInteger(updateId)) {
    rememberTelegramUpdate(updateId);
  }

  try {
    await createBot(env).handleUpdate(update as Update);
  } catch (error) {
    console.error(error);
  }

  return NextResponse.json({ ok: true });
}
