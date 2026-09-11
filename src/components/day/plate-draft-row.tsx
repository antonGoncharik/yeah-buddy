"use client";

import { GramChips } from "@/components/day/gram-chips";
import { GramsYieldToggle } from "@/components/day/grams-yield-toggle";
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
  toCookedGrams,
  toNativeGrams,
} from "@/lib/food/yield";
import { FOOD_STATE_LABELS, FOOD_STATES } from "@/lib/foods";
import { calcMacrosFromPer100, formatKcal, formatMacro } from "@/lib/nutrition";
import type { FoodState } from "@/lib/types";

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
  onPatchNew,
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
  onPatchNew?: (patch: {
    name?: string;
    state?: FoodState;
    proteinInput?: string;
    fatInput?: string;
    carbsInput?: string;
  }) => void;
}) {
  const grams = Number(gramsInput.replace(",", "."));
  const nativeGrams = toNativeGrams(
    Number.isFinite(grams) ? grams : 0,
    gramsMode,
    yieldPair,
  );
  const totals =
    nativeGrams > 0
      ? calcMacrosFromPer100(
          {
            protein: item.protein_per_100,
            fat: item.fat_per_100,
            carbs: item.carbs_per_100,
            kcal: item.kcal_per_100,
          },
          nativeGrams,
        )
      : null;
  const cookedPortion =
    yieldPair &&
    item.kind === "food" &&
    item.default_portion_g &&
    item.default_portion_g > 0
      ? toCookedGrams(item.default_portion_g, yieldPair)
      : null;
  const nativeLabel = nativeYieldLabel(
    item.kind === "food" || item.kind === "new" ? item.state : "raw",
  );

  return (
    <div className="card-surface flex flex-col gap-3 px-4 py-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {item.kind === "new" && onPatchNew ? (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <Label className="text-base">Название</Label>
                <span className="text-sm text-muted-foreground">новый</span>
              </div>
              <Input
                value={item.name}
                onChange={(event) => onPatchNew({ name: event.target.value })}
                className="h-12 text-lg"
              />
            </div>
          ) : (
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <p className="text-lg font-medium">{item.name}</p>
            </div>
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

      {item.kind === "new" && onPatchNew ? (
        <>
          <div className="flex flex-col gap-2">
            <Label className="text-base">Состояние</Label>
            <div className="flex flex-wrap gap-2">
              {FOOD_STATES.map((state) => (
                <Button
                  key={state}
                  type="button"
                  variant={item.state === state ? "secondary" : "outline"}
                  className="h-10 px-3 text-sm"
                  onClick={() => onPatchNew({ state })}
                >
                  {FOOD_STATE_LABELS[state]}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-base font-medium">На 100 г</p>
            <div className="grid grid-cols-3 gap-2">
              <Field
                label="Б"
                value={proteinInput}
                onChange={(value) => onPatchNew({ proteinInput: value })}
              />
              <Field
                label="Ж"
                value={fatInput}
                onChange={(value) => onPatchNew({ fatInput: value })}
              />
              <Field
                label="У"
                value={carbsInput}
                onChange={(value) => onPatchNew({ carbsInput: value })}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {formatKcal(item.kcal_per_100)} ккал / 100 г
            </p>
          </div>
        </>
      ) : null}

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
          equivalentLabel={
            nativeGrams > 0
              ? gramsMode === "cooked"
                ? `${formatYieldGrams(nativeGrams)} г ${nativeLabel.toLowerCase()}`
                : `${formatYieldGrams(toCookedGrams(nativeGrams, yieldPair))} г готового`
              : `${formatYieldGrams(yieldPair.from_g)} → ${formatYieldGrams(yieldPair.to_g)}`
          }
          onChange={onGramsModeChange}
        />
      ) : null}

      <GramChips
        onPick={(value) => onGramsChange(formatYieldGrams(value))}
        defaultPortionG={
          gramsMode === "cooked" && cookedPortion != null
            ? cookedPortion
            : item.kind === "food"
              ? item.default_portion_g
              : null
        }
        defaultPortionLabel={
          gramsMode === "cooked" && cookedPortion != null
            ? `${formatYieldGrams(cookedPortion)} г готового`
            : item.kind === "food"
              ? item.default_portion_label
              : null
        }
      />

      <Button
        type="button"
        variant="ghost"
        className="h-11 self-start px-0 text-base"
        onClick={onChangeFood}
      >
        Другой продукт
      </Button>

      {totals ? (
        <p className="text-base tabular-nums">
          Б {formatMacro(totals.protein)} · Ж {formatMacro(totals.fat)} · У{" "}
          {formatMacro(totals.carbs)} · {formatKcal(totals.kcal)} ккал
        </p>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-sm">{label}</Label>
      <Input
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 text-base"
      />
    </div>
  );
}
