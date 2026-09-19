import { NAMED_MEAL_EMPTY } from "@/lib/messages";
import { PackEmptyError, PackNotFoundError } from "@/lib/share/pack-errors";
import {
  assertPackQuota,
  findClone,
  loadOwnedPack,
  loadOwnerName,
  loadPublicPack,
} from "@/lib/share/pack-load";
import {
  mapPackRow,
  mealPreview,
  mealsPreview,
  resolveTitle,
  toSummary,
  workoutsPreview,
} from "@/lib/share/pack-map";
import {
  insertPack,
  snapshotLive,
  snapshotMealPack,
} from "@/lib/share/pack-write";
import type {
  MealPackPayload,
  MealsPackPayload,
  SharePackKind,
  WorkoutsPackPayload,
} from "@/lib/share/payload";
import type { SharePackDetail, SharePackSummary } from "@/lib/share/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listOwnedPacks(
  userId: string,
): Promise<SharePackSummary[]> {
  const supabase = createSupabaseServerClient();
  const result = await supabase
    .from("share_packs")
    .select(
      "id, owner_user_id, source_pack_id, kind, token, title, payload, revoked_at, created_at",
    )
    .eq("owner_user_id", userId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (result.error) {
    throw result.error;
  }

  const rows = (result.data ?? []).flatMap((row) => {
    const parsed = mapPackRow(row as Record<string, unknown>);
    return parsed ? [parsed] : [];
  });

  return Promise.all(rows.map((row) => toSummary(row, userId)));
}

export async function getPackDetail(
  userId: string,
  token: string,
): Promise<SharePackDetail> {
  const pack = await loadPublicPack(token);
  if (!pack) {
    throw new PackNotFoundError();
  }

  if (pack.revoked_at) {
    throw new PackNotFoundError();
  }

  const saved =
    pack.owner_user_id === userId || (await findClone(userId, pack.id)) != null;
  const ownerName = await loadOwnerName(pack.owner_user_id);
  const summary = await toSummary(pack, userId);

  return {
    ...summary,
    owner_name: ownerName,
    saved,
    meals:
      pack.kind === "meals"
        ? mealsPreview(pack.payload as MealsPackPayload)
        : null,
    workouts:
      pack.kind === "workouts"
        ? workoutsPreview(pack.payload as WorkoutsPackPayload)
        : null,
    meal:
      pack.kind === "meal"
        ? mealPreview(pack.payload as MealPackPayload)
        : null,
  };
}

export async function publishLivePack(
  userId: string,
  kind: SharePackKind,
  titleRaw?: string,
): Promise<SharePackDetail> {
  if (kind === "meal") {
    throw new PackEmptyError(NAMED_MEAL_EMPTY);
  }
  await assertPackQuota(userId);
  const payload = await snapshotLive(userId, kind);
  const title = resolveTitle(titleRaw, kind, payload);
  const pack = await insertPack({
    ownerUserId: userId,
    sourcePackId: null,
    kind,
    title,
    payload,
  });
  return getPackDetail(userId, pack.token);
}

export async function publishMealPack(
  userId: string,
  source: { mealId?: string; namedMealId?: string },
  titleRaw?: string,
): Promise<SharePackDetail> {
  await assertPackQuota(userId);
  const payload = await snapshotMealPack(userId, source);
  const title = resolveTitle(titleRaw, "meal", payload);
  const pack = await insertPack({
    ownerUserId: userId,
    sourcePackId: null,
    kind: "meal",
    title,
    payload,
  });
  return getPackDetail(userId, pack.token);
}

export async function savePackCopy(
  userId: string,
  token: string,
): Promise<SharePackDetail> {
  const source = await loadPublicPack(token);
  if (!source || source.revoked_at) {
    throw new PackNotFoundError();
  }

  if (source.owner_user_id === userId) {
    return getPackDetail(userId, source.token);
  }

  const existing = await findClone(userId, source.id);
  if (existing) {
    if (existing.revoked_at) {
      await restorePack(userId, existing.id);
    }
    return getPackDetail(userId, existing.token);
  }

  await assertPackQuota(userId);
  const copy = await insertPack({
    ownerUserId: userId,
    sourcePackId: source.id,
    kind: source.kind,
    title: source.title,
    payload: source.payload,
  });
  return getPackDetail(userId, copy.token);
}

export async function revokePack(userId: string, token: string): Promise<void> {
  const pack = await loadOwnedPack(userId, token);
  if (!pack) {
    throw new PackNotFoundError();
  }

  if (pack.revoked_at) {
    return;
  }

  const supabase = createSupabaseServerClient();
  const updated = await supabase
    .from("share_packs")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", pack.id)
    .eq("owner_user_id", userId);

  if (updated.error) {
    throw updated.error;
  }
}

async function restorePack(userId: string, packId: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const restored = await supabase
    .from("share_packs")
    .update({ revoked_at: null })
    .eq("id", packId)
    .eq("owner_user_id", userId);

  if (restored.error) {
    throw restored.error;
  }
}
