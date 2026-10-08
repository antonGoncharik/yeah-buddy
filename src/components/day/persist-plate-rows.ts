import type { PlateRow } from "@/components/day/plate-draft";
import {
  commitItemsFromRows,
  toCommitItem,
} from "@/components/day/plate-draft-commit";
import type { PlateDraftItem } from "@/lib/ai/plate-types";
import { postJson } from "@/lib/api-cache";
import { daysUrl, readCachedDay, withDayOptimistic } from "@/lib/day/cache";
import {
  mealItemFromFood,
  mealItemFromLump,
  withAddedItems,
  withReplacedItems,
} from "@/lib/day/optimistic";
import { readMealItemsPayload } from "@/lib/meal/parse";
import { queueMutate } from "@/lib/offline-mutate";
import type { MealItem } from "@/lib/types";

export async function persistPlateRows({
  date,
  mealId,
  rows,
}: {
  date: string;
  mealId: string;
  rows: PlateRow[];
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const prepared = commitItemsFromRows(rows);
  if (!prepared.ok) {
    return { ok: false, message: prepared.message };
  }

  const current = readCachedDay(date);
  if (current) {
    const temps = prepared.items.map((item) =>
      plateItemFromDraft(mealId, item),
    );
    await withDayOptimistic(
      date,
      withAddedItems(current, mealId, temps),
      async () => {
        const data = await queueMutate({
          method: "POST",
          url: `/api/meals/${mealId}/plate`,
          body: { items: prepared.items.map(toCommitItem) },
          cacheUrls: [daysUrl(date)],
          clientIds: temps.map((item) => item.id),
        });
        const saved = readMealItemsPayload(data);
        const latest = readCachedDay(date);
        if (latest && saved.length === temps.length) {
          const replacements = new Map<string, MealItem>();
          temps.forEach((temp, index) => {
            const next = saved[index];
            if (next) {
              replacements.set(temp.id, next);
            }
          });
          return withReplacedItems(latest, replacements);
        }
        return latest ?? "keep";
      },
    );
    return { ok: true };
  }

  await postJson(`/api/meals/${mealId}/plate`, {
    items: prepared.items.map(toCommitItem),
  });
  return { ok: true };
}

function plateItemFromDraft(mealId: string, item: PlateDraftItem): MealItem {
  if (item.kind === "lump") {
    return mealItemFromLump(mealId, item);
  }
  return mealItemFromFood({
    mealId,
    food: {
      id: item.foodId,
      name: item.name,
      protein_per_100: item.protein_per_100,
      fat_per_100: item.fat_per_100,
      carbs_per_100: item.carbs_per_100,
      kcal_per_100: item.kcal_per_100,
    },
    grams: item.grams,
  });
}
