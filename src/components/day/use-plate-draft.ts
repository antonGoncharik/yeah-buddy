"use client";

import { useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { persistPlateRows } from "@/components/day/persist-plate-rows";
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
import type { GramsMode } from "@/lib/food/yield";
import { haptic } from "@/lib/telegram/haptic";
import type { Food } from "@/lib/types";

export function usePlateDraft({
  view,
  setView,
  mealId,
  date,
  doneHref,
  onSaved,
}: {
  view: PlateStatus;
  setView: Dispatch<SetStateAction<PlateStatus>>;
  mealId: string;
  date: string;
  doneHref: string;
  onSaved?: () => void;
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

  async function saveRows(items: PlateRow[]): Promise<boolean> {
    const result = await persistPlateRows({ date, mealId, rows: items });
    if (!result.ok) {
      haptic("warn");
      setSaveError(result.message);
      return false;
    }

    haptic("commit");
    onSaved?.();
    router.push(doneHref);
    return true;
  }

  async function save() {
    if (view.status !== "draft" && view.status !== "saving") {
      return;
    }

    const items =
      view.status === "draft" || view.status === "saving" ? view.items : [];
    await saveRows(items);
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
    saveRows,
  };
}
