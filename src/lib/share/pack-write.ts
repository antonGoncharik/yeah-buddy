import { listMealTemplates } from "@/lib/meal-templates";
import { PACK_EMPTY_MEALS } from "@/lib/messages";
import { getUserSettings } from "@/lib/settings";
import { findClone } from "@/lib/share/pack-load";
import { mapPackRow, type PackRow } from "@/lib/share/pack-map";
import {
  buildMealsPayload,
  buildWorkoutsPayload,
  PackEmptyError,
  type SharePackKind,
  type SharePackPayload,
} from "@/lib/share/payload";
import { createPackToken } from "@/lib/share/token";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureWorkoutSettings } from "@/lib/workout/settings";
import { listTemplates } from "@/lib/workout/templates";

export async function snapshotLive(
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

export async function insertPack(input: {
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
