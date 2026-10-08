import { parsePlateDraftItem } from "@/lib/ai/plate-parse";
import type { PlateDraftItem } from "@/lib/ai/plate-types";
import { mapRecordList } from "@/lib/read";
import { createPackToken } from "@/lib/share/token";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DRAFT_TTL_MS = 48 * 60 * 60 * 1000;
const UNDO_TTL_MS = 15 * 60 * 1000;

export type MealChatDraft = {
  id: string;
  userId: string;
  mealId: string;
  date: string;
  items: PlateDraftItem[];
};

export async function saveMealChatDraft(input: {
  userId: string;
  mealId: string;
  date: string;
  items: PlateDraftItem[];
}): Promise<string> {
  const supabase = createSupabaseServerClient();
  const id = createPackToken();
  const expiresAt = new Date(Date.now() + DRAFT_TTL_MS).toISOString();

  await supabase.from("meal_chat_drafts").delete().eq("user_id", input.userId);

  const saved = await supabase.from("meal_chat_drafts").insert({
    id,
    user_id: input.userId,
    meal_id: input.mealId,
    date: input.date,
    items: input.items,
    expires_at: expiresAt,
  });

  if (saved.error) {
    throw saved.error;
  }

  return id;
}

export async function readMealChatDraft(
  userId: string,
  id: string,
): Promise<MealChatDraft | null> {
  const supabase = createSupabaseServerClient();
  const found = await supabase
    .from("meal_chat_drafts")
    .select("id, user_id, meal_id, date, items, expires_at")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (found.error) {
    throw found.error;
  }

  if (!found.data) {
    return null;
  }

  const expiresAt = Date.parse(String(found.data.expires_at));
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    await supabase.from("meal_chat_drafts").delete().eq("id", id);
    return null;
  }

  const items = mapRecordList(found.data.items, parsePlateDraftItem);
  if (!items || items.length === 0) {
    return null;
  }

  return {
    id: String(found.data.id),
    userId: String(found.data.user_id),
    mealId: String(found.data.meal_id),
    date: String(found.data.date).slice(0, 10),
    items,
  };
}

export async function deleteMealChatDraft(
  userId: string,
  id: string,
): Promise<void> {
  const supabase = createSupabaseServerClient();
  await supabase
    .from("meal_chat_drafts")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
}

export async function saveMealChatUndo(input: {
  userId: string;
  mealItemIds: string[];
}): Promise<string> {
  const supabase = createSupabaseServerClient();
  const id = createPackToken();
  const expiresAt = new Date(Date.now() + UNDO_TTL_MS).toISOString();

  await supabase.from("meal_chat_undo").delete().eq("user_id", input.userId);

  const saved = await supabase.from("meal_chat_undo").insert({
    id,
    user_id: input.userId,
    meal_item_ids: input.mealItemIds,
    expires_at: expiresAt,
  });

  if (saved.error) {
    throw saved.error;
  }

  return id;
}

export async function consumeMealChatUndo(
  userId: string,
  id: string,
): Promise<string[] | null> {
  const supabase = createSupabaseServerClient();
  const found = await supabase
    .from("meal_chat_undo")
    .select("meal_item_ids, expires_at")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (found.error) {
    throw found.error;
  }

  if (!found.data) {
    return null;
  }

  const expiresAt = Date.parse(String(found.data.expires_at));
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    await supabase.from("meal_chat_undo").delete().eq("id", id);
    return null;
  }

  await supabase.from("meal_chat_undo").delete().eq("id", id);

  const ids = found.data.meal_item_ids;
  if (!Array.isArray(ids)) {
    return null;
  }

  return ids.filter((value): value is string => typeof value === "string");
}
