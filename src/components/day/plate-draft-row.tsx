"use client";

import { GramChips } from "@/components/day/gram-chips";
import { GramsYieldToggle } from "@/components/day/grams-yield-toggle";
import { PlateDraftLumpFields } from "@/components/day/plate-draft-new-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RemoveRowButton } from "@/components/ui/remove-row-button";
import type { PlateDraftItem } from "@/lib/ai/plate-types";
import {
  type FoodYield,
  formatYieldGrams,
  type GramsMode,
  nativeYieldLabel,
  parseGramsInput,
  toNativeGrams,
} from "@/lib/food/yield";
import { gramsChipForMode, yieldEquivalentLabel } from "@/lib/food/yield-copy";
import { calcMacrosFromPer100, formatKcal, formatMacro } from "@/lib/nutrition";

export function PlateDraftRow({
  item,
  gramsInput,
  gramsMode,
  yieldPair,
  proteinInput,
  fatInput,
  carbsInput,
  onGramsChange,
  onGramsModeChange,
  onRemove,
  onChangeFood,
  onPatchLump,
}: {
  item: PlateDraftItem;
  gramsInput: string;
  gramsMode: GramsMode;
  yieldPair: FoodYield | null;
  proteinInput: string;
  fatInput: string;
  carbsInput: string;
  onGramsChange: (value: string) => void;
  onGramsModeChange: (mode: GramsMode) => void;
  onRemove: () => void;
  onChangeFood: () => void;
  onPatchLump?: (patch: {
    name?: string;
    proteinInput?: string;
    fatInput?: string;
    carbsInput?: string;
  }) => void;
}) {
  const grams = parseGramsInput(gramsInput) ?? 0;
  const nativeGrams = toNativeGrams(grams, gramsMode, yieldPair);
  const totals =
    item.kind === "food" && nativeGrams > 0
      ? calcMacrosFromPer100(
          {
            protein: item.protein_per_100,
            fat: item.fat_per_100,
            carbs: item.carbs_per_100,
            kcal: item.kcal_per_100,
          },
          nativeGrams,
        )
      : item.kind === "lump"
        ? {
            protein: item.protein,
            fat: item.fat,
            carbs: item.carbs,
            kcal: item.kcal,
          }
        : null;
  const nativeLabel = nativeYieldLabel(
    item.kind === "food" ? item.state : "raw",
  );
  const chip = gramsChipForMode(
    gramsMode,
    yieldPair,
    item.kind === "food" ? item.default_portion_g : null,
    item.kind === "food" ? item.default_portion_label : null,
  );

  return (
    <div className="card-surface flex flex-col gap-3 px-4 py-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {item.kind === "lump" && onPatchLump ? (
            <div className="flex flex-col gap-2">
              <Label className="text-base">Что это</Label>
              <Input
                value={item.name}
                onChange={(event) => onPatchLump({ name: event.target.value })}
                className="h-12 text-lg"
              />
            </div>
          ) : (
            <p className="text-lg font-medium">{item.name}</p>
          )}
          {item.kind === "food" ? (
            <p className="mt-1 text-sm text-muted-foreground">
              На 100 г: Б {formatMacro(item.protein_per_100)} · Ж{" "}
              {formatMacro(item.fat_per_100)} · У{" "}
              {formatMacro(item.carbs_per_100)}
            </p>
          ) : null}
        </div>
        <RemoveRowButton onClick={onRemove} />
      </div>

      {item.kind === "lump" && onPatchLump ? (
        <PlateDraftLumpFields
          item={item}
          proteinInput={proteinInput}
          fatInput={fatInput}
          carbsInput={carbsInput}
          onPatchLump={onPatchLump}
        />
      ) : null}

      {item.kind === "food" ? (
        <>
          <div className="flex flex-col gap-2">
            <Label className="text-base">Граммы</Label>
            <Input
              inputMode="decimal"
              value={gramsInput}
              onChange={(event) => onGramsChange(event.target.value)}
              className="h-12 text-lg"
            />
          </div>

          {yieldPair ? (
            <GramsYieldToggle
              mode={gramsMode}
              nativeLabel={nativeLabel}
              equivalentLabel={yieldEquivalentLabel(
                nativeGrams,
                gramsMode,
                yieldPair,
                nativeLabel,
              )}
              onChange={onGramsModeChange}
            />
          ) : null}

          <GramChips
            onPick={(value) => onGramsChange(formatYieldGrams(value))}
            defaultPortionG={chip.grams ?? null}
            defaultPortionLabel={chip.label ?? null}
          />
        </>
      ) : null}

      <Button
        type="button"
        variant="ghost"
        className="h-11 self-start px-0 text-base"
        onClick={onChangeFood}
      >
        {item.kind === "lump" ? "Это из базы" : "Другой продукт"}
      </Button>

      {item.kind === "food" && totals ? (
        <p className="text-base tabular-nums">
          Б {formatMacro(totals.protein)} · Ж {formatMacro(totals.fat)} · У{" "}
          {formatMacro(totals.carbs)} · {formatKcal(totals.kcal)} ккал
        </p>
      ) : null}
    </div>
  );
}
