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
  patchNewFoodRow,
  withGramsMode,
} from "@/components/day/plate-draft";
import {
  commitItemsFromRows,
  toCommitItem,
} from "@/components/day/plate-draft-commit";
import { postJson } from "@/lib/api-cache";
import type { GramsMode } from "@/lib/food/yield";
import { LOAD_FAILED } from "@/lib/messages";
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

  function setGramsMode(index: number, mode: GramsMode) {
    patchDraftItem(index, (item) => withGramsMode(item, mode));
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

    const prepared = commitItemsFromRows(view.items);
    if (!prepared.ok) {
      haptic("warn");
      setSaveError(prepared.message);
      return;
    }

    setSaveError(null);
    setView({
      status: "saving",
      previewUrl: view.previewUrl,
      items: view.items,
    });

    try {
      await postJson(`/api/meals/${mealId}/plate`, {
        items: prepared.items.map(toCommitItem),
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
    setGramsMode,
    patchNew,
    removeItem,
    pickFood,
    save,
  };
}
