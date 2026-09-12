import { mapFood } from "@/lib/food/map";
import type { FoodInput } from "@/lib/food/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Food } from "@/lib/types";

export async function createFood(
  userId: string,
  input: FoodInput,
): Promise<Food> {
  const supabase = createSupabaseServerClient();
  const inserted = await supabase
    .from("foods")
    .insert({
      user_id: userId,
      ...input,
      state: input.state ?? "as_is",
    })
    .select("*")
    .single();

  if (inserted.error || !inserted.data) {
    throw inserted.error ?? new Error("Food insert failed");
  }

  return mapFood(inserted.data as Record<string, unknown>);
}

export async function updateFood(
  userId: string,
  id: string,
  input: FoodInput,
): Promise<Food | null> {
  const supabase = createSupabaseServerClient();
  const updated = await supabase
    .from("foods")
    .update(input)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (updated.error) {
    throw updated.error;
  }

  if (!updated.data) {
    return null;
  }

  return mapFood(updated.data as Record<string, unknown>);
}

export async function deleteFood(userId: string, id: string): Promise<boolean> {
  const supabase = createSupabaseServerClient();
  const deleted = await supabase
    .from("foods")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (deleted.error) {
    throw deleted.error;
  }

  return Boolean(deleted.data);
}

export async function setFoodFavorite(
  userId: string,
  id: string,
  isFavorite: boolean,
): Promise<Food | null> {
  const supabase = createSupabaseServerClient();
  const updated = await supabase
    .from("foods")
    .update({ is_favorite: isFavorite })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (updated.error) {
    throw updated.error;
  }

  if (!updated.data) {
    return null;
  }

  return mapFood(updated.data as Record<string, unknown>);
}
