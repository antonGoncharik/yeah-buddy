import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { User } from "@/lib/types";

export type TelegramProfile = {
  id: number;
  username?: string | null;
  first_name?: string | null;
  language_code?: string | null;
};

export async function upsertTelegramUser(
  telegramUser: TelegramProfile,
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
