import { listMealTemplates } from "@/lib/meal-templates";
import { PACK_EMPTY_MEALS } from "@/lib/messages";
import { getUserSettings } from "@/lib/settings";
import { PackNotFoundError } from "@/lib/share/pack-errors";
import {
  assertPackQuota,
  findClone,
  loadOwnedPack,
  loadOwnerName,
  loadPublicPack,
} from "@/lib/share/pack-load";
import {
  mapPackRow,
  mealsPreview,
  type PackRow,
  resolveTitle,
  toSummary,
  workoutsPreview,
} from "@/lib/share/pack-map";
import {
  buildMealsPayload,
  buildWorkoutsPayload,
  type MealsPackPayload,
  PackEmptyError,
  type SharePackKind,
  type SharePackPayload,
  type WorkoutsPackPayload,
} from "@/lib/share/payload";
import { createPackToken } from "@/lib/share/token";
import type { SharePackDetail, SharePackSummary } from "@/lib/share/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureWorkoutSettings } from "@/lib/workout/settings";
import { listTemplates } from "@/lib/workout/templates";

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

  if (pack.revoked_at && pack.owner_user_id !== userId) {
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
  };
}

export async function publishLivePack(
  userId: string,
  kind: SharePackKind,
  titleRaw?: string,
): Promise<SharePackDetail> {
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

export async function revokePack(
  userId: string,
  token: string,
): Promise<SharePackDetail> {
  const pack = await loadOwnedPack(userId, token);
  if (!pack) {
    throw new PackNotFoundError();
  }

  if (pack.revoked_at) {
    return getPackDetail(userId, pack.token);
  }

  const supabase = createSupabaseServerClient();
  const updated = await supabase
    .from("share_packs")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", pack.id)
    .eq("owner_user_id", userId)
    .select("token")
    .maybeSingle();

  if (updated.error) {
    throw updated.error;
  }

  return getPackDetail(userId, pack.token);
}

async function snapshotLive(
  userId: string,
  kind: SharePackKind,
): Promise<SharePackPayload> {
  if (kind === "meals") {
    const settings = await getUserSettings(userId);
    if (!settings) {
      throw new PackEmptyError(PACK_EMPTY_MEALS);
    }
    const templates = await listMealTemplates(userId);
    return buildMealsPayload(settings, templates);
  }

  const settings = await ensureWorkoutSettings(userId);
  const templates = await listTemplates(userId);
  return buildWorkoutsPayload(settings, templates);
}

async function insertPack(input: {
  ownerUserId: string;
  sourcePackId: string | null;
  kind: SharePackKind;
  title: string;
  payload: SharePackPayload;
}): Promise<PackRow> {
  const supabase = createSupabaseServerClient();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = createPackToken();
    const inserted = await supabase
      .from("share_packs")
      .insert({
        owner_user_id: input.ownerUserId,
        source_pack_id: input.sourcePackId,
        kind: input.kind,
        token,
        title: input.title,
        payload: input.payload,
      })
      .select(
        "id, owner_user_id, source_pack_id, kind, token, title, payload, revoked_at, created_at",
      )
      .single();

    if (inserted.error) {
      if (inserted.error.code === "23505") {
        if (input.sourcePackId) {
          const existing = await findClone(
            input.ownerUserId,
            input.sourcePackId,
          );
          if (existing) {
            return existing;
          }
        }
        continue;
      }
      throw inserted.error;
    }

    const row = mapPackRow(inserted.data as Record<string, unknown>);
    if (!row) {
      throw new Error("Pack insert failed");
    }
    return row;
  }

  throw new Error("Pack token collision");
}
