"use client";

import { Plus } from "lucide-react";
import { mealActionFullButtonClass } from "@/components/day/meal-action-bar";
import type { PlateLumpPatch } from "@/components/day/plate-draft";
import {
  type PlateRow,
  rowNativeGrams,
  rowYield,
} from "@/components/day/plate-draft";
import { PlateDraftRow } from "@/components/day/plate-draft-row";
import { Button } from "@/components/ui/button";
import { SortableList } from "@/components/workout/sortable-list";
import type { GramsMode } from "@/lib/food/yield";
import {
  calcMacrosFromPer100,
  formatKcal,
  formatMacro,
  sumMealItems,
} from "@/lib/nutrition";

export function PlateDraftPanel({
  items,
  busy,
  error,
  canAddFood,
  onReorder,
  onGrams,
  onGramsMode,
  onRemove,
  onChangeFood,
  onToLump,
  onPatchLump,
  onAddLump,
  onAddFood,
}: {
  items: PlateRow[];
  busy: boolean;
  error: string | null;
  canAddFood: boolean;
  onReorder: (items: PlateRow[]) => void;
  onGrams: (rowId: string, value: string) => void;
  onGramsMode: (rowId: string, mode: GramsMode) => void;
  onRemove: (rowId: string) => void;
  onChangeFood: (rowId: string) => void;
  onToLump: (rowId: string) => void;
  onPatchLump: (rowId: string, patch: PlateLumpPatch) => void;
  onAddLump: () => void;
  onAddFood: () => void;
}) {
  const totals = sumDraft(items);

  return (
    <>
      {items.length > 0 ? (
        <SortableList
          variant="cards"
          items={items.map((item) => ({ ...item, id: item.rowId }))}
          disabled={busy}
          onReorder={(next) => onReorder(next)}
          renderItem={(item) => (
            <PlateDraftRow
              item={item}
              gramsInput={item.gramsInput}
              gramsMode={item.gramsMode}
              yieldPair={rowYield(item)}
              proteinInput={item.proteinInput}
              fatInput={item.fatInput}
              carbsInput={item.carbsInput}
              onGramsChange={(value) => onGrams(item.rowId, value)}
              onGramsModeChange={(mode) => onGramsMode(item.rowId, mode)}
              onRemove={() => onRemove(item.rowId)}
              onChangeFood={() => onChangeFood(item.rowId)}
              onToLump={
                item.kind === "food" ? () => onToLump(item.rowId) : undefined
              }
              onPatchLump={
                item.kind === "lump"
                  ? (patch) => onPatchLump(item.rowId, patch)
                  : undefined
              }
            />
          )}
        />
      ) : null}

      {canAddFood ? (
        <>
          <Button
            type="button"
            variant="outline"
            className={mealActionFullButtonClass}
            disabled={busy}
            onClick={onAddLump}
          >
            <Plus className="size-4" aria-hidden />
            Быстрая запись
          </Button>
          <Button
            type="button"
            variant="outline"
            className={mealActionFullButtonClass}
            disabled={busy}
            onClick={onAddFood}
          >
            <Plus className="size-4" aria-hidden />
            Из своей базы
          </Button>
        </>
      ) : null}

      {totals ? (
        <div className="card-surface px-5 py-4 text-lg">
          Итого: Б {formatMacro(totals.protein)} · Ж {formatMacro(totals.fat)} ·
          У {formatMacro(totals.carbs)} · {formatKcal(totals.kcal)} ккал
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </>
  );
}

function sumDraft(items: PlateRow[]) {
  const macros = items.flatMap((item) => {
    if (item.kind === "lump") {
      if (item.protein + item.fat + item.carbs <= 0) {
        return [];
      }
      return [
        {
          protein: item.protein,
          fat: item.fat,
          carbs: item.carbs,
          kcal: item.kcal,
        },
      ];
    }

    const grams = rowNativeGrams(item);
    if (grams == null) {
      return [];
    }
    return [
      calcMacrosFromPer100(
        {
          protein: item.protein_per_100,
          fat: item.fat_per_100,
          carbs: item.carbs_per_100,
          kcal: item.kcal_per_100,
        },
        grams,
      ),
    ];
  });

  if (macros.length === 0) {
    return null;
  }

  return sumMealItems(macros);
}
