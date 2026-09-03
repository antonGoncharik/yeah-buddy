import { webhookCallback } from "grammy";
import { NextResponse } from "next/server";

import { getServerEnv } from "@/lib/env";
import { LOAD_FAILED } from "@/lib/messages";
import { createBot } from "@/lib/telegram/bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const env = getServerEnv();
    const handleUpdate = webhookCallback(createBot(env), "std/http");
    return await handleUpdate(request);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: LOAD_FAILED }, { status: 500 });
  }
}
