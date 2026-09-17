"use client";

import { useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import {
  emptyLumpRow,
  foodRowFromPick,
  foodRowToLump,
  mergeFoodRows,
  type PlateLumpPatch,
  type PlatePicker,
  type PlateRow,
  type PlateStatus,
  patchLumpRow,
  withGramsMode,
} from "@/components/day/plate-draft";
import {
  commitItemsFromRows,
  toCommitItem,
} from "@/components/day/plate-draft-commit";
import type { PlateDraftItem } from "@/lib/ai/plate-types";
import { postJson } from "@/lib/api-cache";
import { readCachedDay, withDayOptimistic } from "@/lib/day/cache";
import {
  mealItemFromFood,
  mealItemFromLump,
  withAddedItems,
  withReplacedItems,
} from "@/lib/day/optimistic";
import type { GramsMode } from "@/lib/food/yield";
import { readMealItemsPayload } from "@/lib/meal/parse";
import { haptic } from "@/lib/telegram/haptic";
import type { Food, MealItem } from "@/lib/types";

export function usePlateDraft({
  view,
  setView,
  mealId,
  date,
  doneHref,
}: {
  view: PlateStatus;
  setView: Dispatch<SetStateAction<PlateStatus>>;
  mealId: string;
  date: string;
  doneHref: string;
}) {
  const router = useRouter();
  const [picker, setPicker] = useState<PlatePicker>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  function patchDraftItem(rowId: string, update: (item: PlateRow) => PlateRow) {
    setView((current) => {
      if (current.status !== "draft") {
        return current;
      }
      return {
        ...current,
        items: current.items.map((item) =>
          item.rowId === rowId ? update(item) : item,
        ),
      };
    });
  }

  function setGrams(rowId: string, gramsInput: string) {
    patchDraftItem(rowId, (item) => ({ ...item, gramsInput }));
  }

  function setGramsMode(rowId: string, mode: GramsMode) {
    patchDraftItem(rowId, (item) => withGramsMode(item, mode));
  }

  function patchLump(rowId: string, patch: PlateLumpPatch) {
    patchDraftItem(rowId, (item) => patchLumpRow(item, patch));
  }

  function removeItem(rowId: string) {
    haptic("tick");
    setView((current) => {
      if (current.status !== "draft") {
        return current;
      }
      const items = current.items.filter((item) => item.rowId !== rowId);
      if (items.length === 0) {
        return { status: "empty", previewUrl: current.previewUrl };
      }
      return { ...current, items };
    });
  }

  function reorderItems(items: PlateRow[]) {
    setView((current) => {
      if (current.status !== "draft") {
        return current;
      }
      return { ...current, items };
    });
  }

  function addLump() {
    haptic("tick");
    setView((current) => {
      if (current.status === "idle") {
        return { status: "draft", previewUrl: "", items: [emptyLumpRow()] };
      }
      if (current.status !== "draft" && current.status !== "empty") {
        return current;
      }
      const next = emptyLumpRow();
      if (current.status === "empty") {
        return {
          status: "draft",
          previewUrl: current.previewUrl,
          items: [next],
        };
      }
      return { ...current, items: [...current.items, next] };
    });
  }

  function toLump(rowId: string) {
    haptic("tick");
    patchDraftItem(rowId, (item) => foodRowToLump(item));
  }

  function pickFood(food: Food) {
    haptic("tick");
    setPicker(null);
    setView((current) => {
      if (
        current.status !== "draft" &&
        current.status !== "empty" &&
        current.status !== "idle"
      ) {
        return current;
      }
      const previewUrl =
        current.status === "empty" || current.status === "draft"
          ? current.previewUrl
          : "";
      const next = foodRowFromPick(food);

      if (current.status === "empty" || current.status === "idle") {
        return { status: "draft", previewUrl, items: [next] };
      }

      if (picker?.mode === "replace") {
        const items = current.items.map((item) =>
          item.rowId === picker.rowId
            ? {
                ...next,
                gramsInput:
                  item.kind === "lump" ? next.gramsInput : item.gramsInput,
                rowId: item.rowId,
              }
            : item,
        );
        return { ...current, items: mergeFoodRows(items) };
      }

      return { ...current, items: mergeFoodRows([...current.items, next]) };
    });
  }

  async function save() {
    if (view.status !== "draft") {
      return;
    }

    const prepared = commitItemsFromRows(view.items);
    if (!prepared.ok) {
      haptic("warn");
      setSaveError(prepared.message);
      return;
    }

    haptic("commit");
    const current = readCachedDay(date);
    if (current) {
      const temps = prepared.items.map((item) =>
        plateItemFromDraft(mealId, item),
      );
      void withDayOptimistic(
        date,
        withAddedItems(current, mealId, temps),
        async () => {
          const data = await postJson(`/api/meals/${mealId}/plate`, {
            items: prepared.items.map(toCommitItem),
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
    } else {
      void postJson(`/api/meals/${mealId}/plate`, {
        items: prepared.items.map(toCommitItem),
      });
    }
    router.push(doneHref);
  }

  return {
    picker,
    setPicker,
    saveError,
    setSaveError,
    setGrams,
    setGramsMode,
    patchLump,
    removeItem,
    reorderItems,
    pickFood,
    addLump,
    toLump,
    save,
  };
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
