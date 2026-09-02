import { NextResponse } from "next/server";
import { z } from "zod";

import { setSessionCookie } from "@/lib/auth/session";
import { getServerEnv } from "@/lib/env";
import { ensureInitialData } from "@/lib/seed";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifyTelegramInitData } from "@/lib/telegram/verify-init-data";
import type { User } from "@/lib/types";

const OPEN_VIA_BOT = "Откройте приложение через Telegram-бота.";
const GENERIC_ERROR = "Не удалось загрузить данные.";

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
    return jsonError(GENERIC_ERROR, 500);
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
    return jsonError(GENERIC_ERROR, 500);
  }
}

async function upsertTelegramUser(
  telegramUser: NonNullable<ReturnType<typeof verifyTelegramInitData>>,
): Promise<User> {
  const supabase = createSupabaseServerClient();
  const profile = {
    username: telegramUser.username,
    first_name: telegramUser.first_name,
    language_code: telegramUser.language_code,
  };

  const existing = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", telegramUser.id)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  let userRow = existing.data;

  if (!userRow) {
    const created = await supabase
      .from("users")
      .insert({
        telegram_id: telegramUser.id,
        ...profile,
      })
      .select("*")
      .single();

    if (created.error) {
      if (created.error.code === "23505") {
        const raced = await supabase
          .from("users")
          .select("*")
          .eq("telegram_id", telegramUser.id)
          .single();

        if (raced.error || !raced.data) {
          throw raced.error ?? new Error("User lookup failed");
        }

        userRow = raced.data;
      } else {
        throw created.error;
      }
    } else {
      userRow = created.data;
    }
  }

  const updated = await supabase
    .from("users")
    .update(profile)
    .eq("id", userRow.id)
    .select("*")
    .single();

  if (updated.error || !updated.data) {
    throw updated.error ?? new Error("User update failed");
  }

  const settings = await supabase
    .from("user_settings")
    .select("user_id")
    .eq("user_id", updated.data.id)
    .maybeSingle();

  if (settings.error) {
    throw settings.error;
  }

  if (!settings.data) {
    const insertedSettings = await supabase
      .from("user_settings")
      .insert({ user_id: updated.data.id });

    if (insertedSettings.error && insertedSettings.error.code !== "23505") {
      throw insertedSettings.error;
    }
  }

  return mapUser(updated.data);
}

function mapUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    telegram_id: Number(row.telegram_id),
    username: toNullableString(row.username),
    first_name: toNullableString(row.first_name),
    language_code: toNullableString(row.language_code),
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function toNullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  return value;
}

function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ error }, { status });
}
