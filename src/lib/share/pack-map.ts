import { MEAL_DISPLAY_ORDER } from "@/lib/nutrition";
import {
  defaultMealsTitle,
  defaultWorkoutsTitle,
  formulaHint,
  isSharePackKind,
  type MealsPackPayload,
  mealDayTotals,
  mealsPackHint,
  parseSharePayload,
  type SharePackKind,
  type SharePackPayload,
  type WorkoutsPackPayload,
  workoutsPackHint,
} from "@/lib/share/payload";
import type { ShareMealDayPreview, SharePackSummary } from "@/lib/share/types";
import { getPackShareUrl } from "@/lib/telegram/bot";
import { fillFormulas } from "@/lib/workout/map-settings";

const TITLE_MAX = 60;

export type PackRow = {
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

export async function toSummary(
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

export function mealsPreview(payload: MealsPackPayload): {
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

export function workoutsPreview(payload: WorkoutsPackPayload): {
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

export function mapPackRow(row: Record<string, unknown>): PackRow | null {
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

export function resolveTitle(
  raw: string | undefined,
  kind: SharePackKind,
  payload: SharePackPayload,
): string {
  const trimmed = raw?.trim() ?? "";
  if (trimmed !== "") {
    return trimmed.slice(0, TITLE_MAX);
  }

  if (kind === "meals") {
    return defaultMealsTitle(payload as MealsPackPayload).slice(0, TITLE_MAX);
  }

  return defaultWorkoutsTitle(payload as WorkoutsPackPayload).slice(
    0,
    TITLE_MAX,
  );
}
