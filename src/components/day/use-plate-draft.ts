"use client";

import { useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import {
  foodRowFromPick,
  mergeFoodRows,
  type PlateNewPatch,
  type PlatePicker,
  type PlateRow,
  type PlateStatus,
  parseGramsInput,
  patchNewFoodRow,
  toCommitItem,
} from "@/components/day/plate-draft";
import { parseNonneg } from "@/components/foods/food-form-state";
import { PLATE_GRAMS_MAX, type PlateDraftItem } from "@/lib/ai/plate-types";
import { postJson } from "@/lib/api-cache";
import { CHECK_FIELDS, LOAD_FAILED } from "@/lib/messages";
import { calcKcalFromMacros } from "@/lib/nutrition";
import { haptic } from "@/lib/telegram/haptic";
import type { Food } from "@/lib/types";

export function usePlateDraft({
  view,
  setView,
  mealId,
  doneHref,
}: {
  view: PlateStatus;
  setView: Dispatch<SetStateAction<PlateStatus>>;
  mealId: string;
  doneHref: string;
}) {
  const router = useRouter();
  const [picker, setPicker] = useState<PlatePicker>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  function patchDraftItem(index: number, update: (item: PlateRow) => PlateRow) {
    setView((current) => {
      if (current.status !== "draft") {
        return current;
      }
      return {
        ...current,
        items: current.items.map((item, itemIndex) =>
          itemIndex === index ? update(item) : item,
        ),
      };
    });
  }

  function setGrams(index: number, gramsInput: string) {
    patchDraftItem(index, (item) => ({ ...item, gramsInput }));
  }

  function patchNew(index: number, patch: PlateNewPatch) {
    patchDraftItem(index, (item) => patchNewFoodRow(item, patch));
  }

  function removeItem(index: number) {
    haptic("tick");
    setView((current) => {
      if (current.status !== "draft") {
        return current;
      }
      const items = current.items.filter((_, itemIndex) => itemIndex !== index);
      if (items.length === 0) {
        return { status: "empty", previewUrl: current.previewUrl };
      }
      return { ...current, items };
    });
  }

  function pickFood(food: Food) {
    haptic("tick");
    setPicker(null);
    setView((current) => {
      if (current.status !== "draft" && current.status !== "empty") {
        return current;
      }
      const previewUrl =
        current.status === "empty" || current.status === "draft"
          ? current.previewUrl
          : "";
      const next = foodRowFromPick(food);

      if (current.status === "empty") {
        return { status: "draft", previewUrl, items: [next] };
      }

      if (picker?.mode === "replace") {
        const items = current.items.map((item, index) =>
          index === picker.index
            ? { ...next, gramsInput: item.gramsInput, rowId: item.rowId }
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

    const items: PlateDraftItem[] = [];
    for (const item of view.items) {
      const grams = parseGramsInput(item.gramsInput);
      if (grams == null) {
        haptic("warn");
        setSaveError("Нужны граммы больше 0.");
        return;
      }
      if (item.kind === "new") {
        const protein = parseNonneg(item.proteinInput);
        const fat = parseNonneg(item.fatInput);
        const carbs = parseNonneg(item.carbsInput);
        if (
          item.name.trim() === "" ||
          protein == null ||
          fat == null ||
          carbs == null
        ) {
          haptic("warn");
          setSaveError(CHECK_FIELDS);
          return;
        }
        items.push({
          ...item,
          name: item.name.trim(),
          grams: Math.min(grams, PLATE_GRAMS_MAX),
          protein_per_100: protein,
          fat_per_100: fat,
          carbs_per_100: carbs,
          kcal_per_100: calcKcalFromMacros(protein, fat, carbs),
        });
        continue;
      }
      items.push({ ...item, grams: Math.min(grams, PLATE_GRAMS_MAX) });
    }

    setSaveError(null);
    setView({
      status: "saving",
      previewUrl: view.previewUrl,
      items: view.items,
    });

    try {
      await postJson(`/api/meals/${mealId}/plate`, {
        items: items.map(toCommitItem),
      });
      haptic("success");
      router.push(doneHref);
      router.refresh();
    } catch (caught) {
      haptic("error");
      setView({
        status: "draft",
        previewUrl: view.previewUrl,
        items: view.items,
      });
      setSaveError(caught instanceof Error ? caught.message : LOAD_FAILED);
    }
  }

  return {
    picker,
    setPicker,
    saveError,
    setSaveError,
    setGrams,
    patchNew,
    removeItem,
    pickFood,
    save,
  };
}
