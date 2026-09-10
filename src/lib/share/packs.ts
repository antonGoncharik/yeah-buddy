import { createFood, listFoods } from "@/lib/food/store";
import { foodInputSchema } from "@/lib/foods";
import {
  listMealTemplates,
  replaceMealTemplateItems,
} from "@/lib/meal-templates";
import {
  PACK_EMPTY_MEALS,
  PACK_EMPTY_WORKOUTS,
  PACK_LIMIT,
  PACK_NOT_FOUND,
} from "@/lib/messages";
import { isMealVisible, MEAL_DISPLAY_ORDER } from "@/lib/nutrition";
import { getUserSettings, saveUserSettings } from "@/lib/settings";
import {
  buildMealsPayload,
  buildWorkoutsPayload,
  defaultMealsTitle,
  defaultWorkoutsTitle,
  foodMatchKey,
  formulaHint,
  isSharePackKind,
  type MealsPackPayload,
  mealDayTotals,
  mealsPackHint,
  PackEmptyError,
  parseSharePayload,
  type SharePackKind,
  type SharePackPayload,
  type WorkoutsPackPayload,
  workoutsPackHint,
} from "@/lib/share/payload";
import { createPackToken, isPackToken } from "@/lib/share/token";
import type {
  ShareMealDayPreview,
  SharePackDetail,
  SharePackSummary,
} from "@/lib/share/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPackShareUrl } from "@/lib/telegram/bot";
import { ensureNamedExercise } from "@/lib/workout/exercises";
import { fillFormulas } from "@/lib/workout/map-settings";
import {
  clearSkipTemplateIds,
  ensureWorkoutSettings,
  saveWorkoutSettings,
} from "@/lib/workout/settings";
import {
  createTemplate,
  listTemplates,
  saveRotation,
  updateTemplate,
} from "@/lib/workout/templates";

export class PackNotFoundError extends Error {
  constructor() {
    super(PACK_NOT_FOUND);
  }
}

export class PackLimitError extends Error {
  constructor() {
    super(PACK_LIMIT);
  }
}

export { PackEmptyError };

const MAX_PACKS_PER_USER = 40;
const TITLE_MAX = 60;

type PackRow = {
  id: string;
  owner_user_id: string;
  source_pack_id: string | null;
  kind: SharePackKind;
  token: string;
  title: string;
  payload: SharePackPayload;
  revoked_at: string | null;
  created_at: string;
};

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

export async function applyPack(
  userId: string,
  token: string,
): Promise<SharePackDetail> {
  const pack = await loadOwnedOrPublic(userId, token);
  if (!pack) {
    throw new PackNotFoundError();
  }

  if (pack.kind === "meals") {
    await applyMealsPack(userId, pack.payload as MealsPackPayload);
  } else {
    await applyWorkoutsPack(userId, pack.payload as WorkoutsPackPayload);
  }

  if (pack.owner_user_id !== userId) {
    try {
      await savePackCopy(userId, pack.token);
    } catch (error) {
      if (!(error instanceof PackLimitError)) {
        throw error;
      }
    }
  }

  return getPackDetail(userId, pack.token);
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

async function applyMealsPack(
  userId: string,
  payload: MealsPackPayload,
): Promise<void> {
  const foods = await listFoods(userId, "all");
  const byKey = new Map(
    foods.map((food) => [foodMatchKey(food), food] as const),
  );

  for (const food of payload.foods) {
    const key = foodMatchKey(food);
    if (byKey.has(key)) {
      continue;
    }

    const created = await createFood(
      userId,
      foodInputSchema.parse({
        name: food.name,
        brand: food.brand,
        state: food.state,
        protein_per_100: food.protein_per_100,
        fat_per_100: food.fat_per_100,
        carbs_per_100: food.carbs_per_100,
        kcal_per_100: food.kcal_per_100,
        default_portion_g: food.default_portion_g,
        default_portion_label: food.default_portion_label,
        is_favorite: food.is_favorite,
      }),
    );
    byKey.set(key, created);
  }

  for (const day of payload.templates) {
    const items = day.items.flatMap((item) => {
      if (!isMealVisible(item.meal_type, day.day_type === "training")) {
        return [];
      }
      const food = byKey.get(
        foodMatchKey({
          name: item.food_name,
          state: item.food_state,
          protein_per_100: item.protein_per_100,
          fat_per_100: item.fat_per_100,
          carbs_per_100: item.carbs_per_100,
        }),
      );
      if (!food) {
        return [];
      }
      return [
        {
          mealType: item.meal_type,
          foodId: food.id,
          grams: item.grams,
        },
      ];
    });
    await replaceMealTemplateItems(userId, day.day_type, items);
  }

  await saveUserSettings(userId, {
    rest_protein: payload.goals.rest_protein,
    rest_fat: payload.goals.rest_fat,
    rest_carbs: payload.goals.rest_carbs,
    training_protein: payload.goals.training_protein,
    training_fat: payload.goals.training_fat,
    training_carbs: payload.goals.training_carbs,
  });
}

async function applyWorkoutsPack(
  userId: string,
  payload: WorkoutsPackPayload,
): Promise<void> {
  const byName = new Map<string, string>();
  for (const exercise of payload.exercises) {
    const ensured = await ensureNamedExercise(userId, exercise);
    byName.set(exercise.name, ensured.id);
  }

  const existing = await listTemplates(userId);
  const byTemplateName = new Map(
    existing.map((template) => [template.name, template] as const),
  );
  const activeIds: string[] = [];

  for (const day of payload.templates) {
    const exerciseIds = day.exercises.flatMap((name) => {
      const id = byName.get(name);
      return id ? [id] : [];
    });
    if (exerciseIds.length === 0) {
      continue;
    }

    const current = byTemplateName.get(day.name);
    if (current) {
      await updateTemplate(userId, current.id, {
        name: day.name,
        kind: day.kind,
        is_active: true,
        exercise_ids: exerciseIds,
      });
      activeIds.push(current.id);
      continue;
    }

    const created = await createTemplate(userId, {
      name: day.name,
      kind: day.kind,
      is_active: true,
      exercise_ids: exerciseIds,
    });
    activeIds.push(created.id);
  }

  if (activeIds.length === 0) {
    throw new PackEmptyError(PACK_EMPTY_WORKOUTS);
  }

  const all = await listTemplates(userId);
  await saveRotation(userId, {
    rotation: all.map((template, index) => ({
      id: template.id,
      sort_order: activeIds.includes(template.id)
        ? (activeIds.indexOf(template.id) + 1) * 10
        : 1000 + index,
      is_active: activeIds.includes(template.id),
    })),
  });

  await saveWorkoutSettings(userId, {
    max_increase_percent: payload.max_increase_percent,
    formulas: payload.formulas,
  });
  await clearSkipTemplateIds(userId);
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

async function loadPublicPack(token: string): Promise<PackRow | null> {
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

async function loadOwnedPack(
  userId: string,
  token: string,
): Promise<PackRow | null> {
  const pack = await loadPublicPack(token);
  if (!pack || pack.owner_user_id !== userId) {
    return null;
  }
  return pack;
}

async function loadOwnedOrPublic(
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

async function findClone(
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

async function assertPackQuota(userId: string): Promise<void> {
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

async function loadOwnerName(userId: string): Promise<string | null> {
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

async function toSummary(
  pack: PackRow,
  userId: string,
): Promise<SharePackSummary> {
  const mine = pack.owner_user_id === userId;
  const shareUrl =
    mine && !pack.revoked_at ? await getPackShareUrl(pack.token) : null;
  return {
    id: pack.id,
    token: pack.token,
    kind: pack.kind,
    title: pack.title,
    hint:
      pack.kind === "meals"
        ? mealsPackHint(pack.payload as MealsPackPayload)
        : workoutsPackHint(pack.payload as WorkoutsPackPayload),
    created_at: pack.created_at,
    revoked: Boolean(pack.revoked_at),
    mine,
    share_url: shareUrl,
  };
}

function mealsPreview(payload: MealsPackPayload): {
  goals: MealsPackPayload["goals"];
  days: ShareMealDayPreview[];
} {
  return {
    goals: payload.goals,
    days: payload.templates.map((day) => {
      const totals = mealDayTotals(day.items);
      const byMeal = new Map<
        MealsPackPayload["templates"][number]["items"][number]["meal_type"],
        Array<{ name: string; grams: number }>
      >();
      for (const item of day.items) {
        const current = byMeal.get(item.meal_type) ?? [];
        current.push({ name: item.food_name, grams: item.grams });
        byMeal.set(item.meal_type, current);
      }
      return {
        day_type: day.day_type,
        ...totals,
        meals: MEAL_DISPLAY_ORDER.flatMap((mealType) => {
          const items = byMeal.get(mealType);
          if (!items || items.length === 0) {
            return [];
          }
          return [{ meal_type: mealType, items }];
        }),
      };
    }),
  };
}

function workoutsPreview(payload: WorkoutsPackPayload): {
  formula_hint: string;
  days: Array<{
    name: string;
    kind: WorkoutsPackPayload["templates"][number]["kind"];
    exercises: string[];
  }>;
} {
  return {
    formula_hint: formulaHint(fillFormulas(payload.formulas)),
    days: payload.templates.map((day) => ({
      name: day.name,
      kind: day.kind,
      exercises: day.exercises,
    })),
  };
}

function mapPackRow(row: Record<string, unknown>): PackRow | null {
  if (typeof row.id !== "string" || typeof row.token !== "string") {
    return null;
  }
  if (!isSharePackKind(row.kind)) {
    return null;
  }
  const payload = parseSharePayload(row.kind, row.payload);
  if (!payload) {
    return null;
  }

  return {
    id: row.id,
    owner_user_id: String(row.owner_user_id),
    source_pack_id:
      typeof row.source_pack_id === "string" ? row.source_pack_id : null,
    kind: row.kind,
    token: row.token,
    title: String(row.title ?? ""),
    payload,
    revoked_at: typeof row.revoked_at === "string" ? row.revoked_at : null,
    created_at: String(row.created_at),
  };
}

function resolveTitle(
  raw: string | undefined,
  kind: SharePackKind,
  payload: SharePackPayload,
): string {
  const trimmed = raw?.trim() ?? "";
  if (trimmed !== "") {
    return trimmed.slice(0, TITLE_MAX);
  }

  if (kind === "meals") {
    return defaultMealsTitle().slice(0, TITLE_MAX);
  }

  return defaultWorkoutsTitle(payload as WorkoutsPackPayload).slice(
    0,
    TITLE_MAX,
  );
}
