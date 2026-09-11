import { PackLimitError } from "@/lib/share/pack-errors";
import { mapPackRow, type PackRow } from "@/lib/share/pack-map";
import { isPackToken } from "@/lib/share/token";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_PACKS_PER_USER = 40;

export async function loadPublicPack(token: string): Promise<PackRow | null> {
  if (!isPackToken(token)) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("share_packs")
    .select(
      "id, owner_user_id, source_pack_id, kind, token, title, payload, revoked_at, created_at",
    )
    .eq("token", token)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return null;
  }

  return mapPackRow(result.data as Record<string, unknown>);
}

export async function loadOwnedPack(
  userId: string,
  token: string,
): Promise<PackRow | null> {
  const pack = await loadPublicPack(token);
  if (!pack || pack.owner_user_id !== userId) {
    return null;
  }
  return pack;
}

export async function loadOwnedOrPublic(
  userId: string,
  token: string,
): Promise<PackRow | null> {
  const pack = await loadPublicPack(token);
  if (!pack) {
    return null;
  }
  if (pack.revoked_at && pack.owner_user_id !== userId) {
    return null;
  }
  return pack;
}

export async function findClone(
  userId: string,
  sourcePackId: string,
): Promise<PackRow | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("share_packs")
    .select(
      "id, owner_user_id, source_pack_id, kind, token, title, payload, revoked_at, created_at",
    )
    .eq("owner_user_id", userId)
    .eq("source_pack_id", sourcePackId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    return null;
  }

  return mapPackRow(result.data as Record<string, unknown>);
}

export async function assertPackQuota(userId: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("share_packs")
    .select("id", { count: "exact", head: true })
    .eq("owner_user_id", userId);

  if (result.error) {
    throw result.error;
  }

  if ((result.count ?? 0) >= MAX_PACKS_PER_USER) {
    throw new PackLimitError();
  }
}

export async function loadOwnerName(userId: string): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("users")
    .select("first_name")
    .eq("id", userId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  const name = result.data?.first_name;
  return typeof name === "string" && name.trim() !== "" ? name.trim() : null;
}
