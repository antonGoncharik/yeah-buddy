import { isDayType, isMealType } from "@/lib/nutrition";
import { isRecord, mapRecordList } from "@/lib/read";
import { isSharePackKind } from "@/lib/share/payload";
import type { SharePackDetail, SharePackSummary } from "@/lib/share/types";

export function parseSharePackSummary(value: unknown): SharePackSummary | null {
  if (!isRecord(value) || typeof value.token !== "string") {
    return null;
  }
  if (!isSharePackKind(value.kind) || typeof value.title !== "string") {
    return null;
  }

  return {
    id: String(value.id ?? value.token),
    token: value.token,
    kind: value.kind,
    title: value.title,
    hint: typeof value.hint === "string" ? value.hint : "",
    created_at: typeof value.created_at === "string" ? value.created_at : "",
    revoked: Boolean(value.revoked),
    mine: Boolean(value.mine),
    share_url: typeof value.share_url === "string" ? value.share_url : null,
  };
}

export function readSharePacksPayload(data: unknown): SharePackSummary[] {
  if (!isRecord(data)) {
    return [];
  }

  return mapRecordList(data.packs, parseSharePackSummary);
}

export function parseSharePackDetail(value: unknown): SharePackDetail | null {
  const summary = parseSharePackSummary(value);
  if (!summary || !isRecord(value)) {
    return null;
  }

  return {
    ...summary,
    owner_name: typeof value.owner_name === "string" ? value.owner_name : null,
    saved: Boolean(value.saved),
    meals: parseMealsPreview(value.meals),
    workouts: parseWorkoutsPreview(value.workouts),
  };
}

export function readSharePackPayload(data: unknown): SharePackDetail | null {
  return isRecord(data) ? parseSharePackDetail(data.pack) : null;
}

function parseMealsPreview(value: unknown): SharePackDetail["meals"] {
  if (
    !isRecord(value) ||
    !isRecord(value.goals) ||
    !Array.isArray(value.days)
  ) {
    return null;
  }

  const goals = {
    rest_protein: Number(value.goals.rest_protein),
    rest_fat: Number(value.goals.rest_fat),
    rest_carbs: Number(value.goals.rest_carbs),
    training_protein: Number(value.goals.training_protein),
    training_fat: Number(value.goals.training_fat),
    training_carbs: Number(value.goals.training_carbs),
  };

  if (Object.values(goals).some((item) => !Number.isFinite(item) || item < 0)) {
    return null;
  }

  return {
    goals,
    days: mapRecordList(value.days, (row) => {
      if (!isDayType(row.day_type)) {
        return null;
      }
      return {
        day_type: row.day_type,
        protein: Number(row.protein) || 0,
        fat: Number(row.fat) || 0,
        carbs: Number(row.carbs) || 0,
        kcal: Number(row.kcal) || 0,
        meals: mapRecordList(row.meals, (meal) => {
          if (!isMealType(meal.meal_type) || !Array.isArray(meal.items)) {
            return null;
          }
          return {
            meal_type: meal.meal_type,
            items: mapRecordList(meal.items, (item) => {
              if (typeof item.name !== "string") {
                return null;
              }
              return {
                name: item.name,
                grams: Number(item.grams) || 0,
              };
            }),
          };
        }),
      };
    }),
  };
}

function parseWorkoutsPreview(value: unknown): SharePackDetail["workouts"] {
  if (!isRecord(value) || !Array.isArray(value.days)) {
    return null;
  }

  return {
    formula_hint:
      typeof value.formula_hint === "string"
        ? value.formula_hint
        : "своя схема",
    days: mapRecordList(value.days, (row) => {
      if (typeof row.name !== "string") {
        return null;
      }
      const kind = row.kind === "static" ? "static" : "dynamic";
      const exercises = Array.isArray(row.exercises)
        ? row.exercises.filter(
            (item): item is string => typeof item === "string",
          )
        : [];
      return { name: row.name, kind, exercises };
    }),
  };
}
