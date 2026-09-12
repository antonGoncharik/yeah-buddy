"use client";

import { GramChips } from "@/components/day/gram-chips";
import { GramsYieldToggle } from "@/components/day/grams-yield-toggle";
import { useGramsScreen } from "@/components/day/use-grams-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FoodYield } from "@/lib/food/yield";
import { formatYieldGrams } from "@/lib/food/yield";
import { formatKcal, formatMacro } from "@/lib/nutrition";
import type { FoodState } from "@/lib/types";

export {
  addMealItemGrams,
  addTemplateItemGrams,
  saveMealItemGrams,
  saveTemplateItemGrams,
} from "@/components/day/grams-save";

export function GramsScreen({
  name,
  protein,
  fat,
  carbs,
  kcal,
  initialGrams,
  defaultPortionG,
  defaultPortionLabel,
  yieldPair = null,
  foodState,
  allowCooked = false,
  save,
  backHref,
  doneHref,
  readOnly = false,
}: {
  name: string;
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
  initialGrams: number;
  defaultPortionG: number | null;
  defaultPortionLabel: string | null;
  yieldPair?: FoodYield | null;
  foodState?: FoodState;
  allowCooked?: boolean;
  save?: (grams: number) => Promise<void>;
  backHref: string;
  doneHref: string;
  readOnly?: boolean;
}) {
  const grams = useGramsScreen({
    protein,
    fat,
    carbs,
    kcal,
    initialGrams,
    defaultPortionG,
    defaultPortionLabel,
    yieldPair,
    foodState,
    allowCooked,
    save,
    backHref,
    doneHref,
    readOnly,
  });

  return (
    <div className="animate-rise flex flex-col gap-5 px-4 pb-4">
      <div>
        <p className="text-2xl font-semibold tracking-tight">{name}</p>
        <p className="mt-1 text-base text-muted-foreground">
          На 100 г: Б {formatMacro(protein)} · Ж {formatMacro(fat)} · У{" "}
          {formatMacro(carbs)} · {formatKcal(kcal)} ккал
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-base">Граммы</Label>
        {readOnly ? (
          <p className="text-2xl font-semibold tabular-nums">
            {grams.gramsInput}
          </p>
        ) : (
          <Input
            inputMode="decimal"
            value={grams.gramsInput}
            onChange={(event) => grams.setGramsInput(event.target.value)}
            className="h-14 text-lg"
          />
        )}
      </div>

      {grams.pair ? (
        <GramsYieldToggle
          mode={grams.gramsMode}
          nativeLabel={grams.nativeLabel}
          equivalentLabel={grams.equivalentLabel}
          disabled={readOnly}
          onChange={grams.changeMode}
        />
      ) : null}

      {grams.totals ? (
        <div className="card-surface px-5 py-4 text-lg">
          Итого: Б {formatMacro(grams.totals.protein)} · Ж{" "}
          {formatMacro(grams.totals.fat)} · У {formatMacro(grams.totals.carbs)}{" "}
          · {formatKcal(grams.totals.kcal)} ккал
        </div>
      ) : null}

      {readOnly ? null : (
        <GramChips
          onPick={(value) => grams.setGramsInput(formatYieldGrams(value))}
          defaultPortionG={grams.chip.grams ?? null}
          defaultPortionLabel={grams.chip.label ?? null}
        />
      )}

      {grams.error ? (
        <p className="text-sm text-destructive">{grams.error}</p>
      ) : null}

      {readOnly ? null : (
        <Button
          className="h-14 text-lg"
          disabled={grams.saving}
          onClick={() => void grams.onSave()}
        >
          {grams.saving ? "Сохранение…" : "Сохранить"}
        </Button>
      )}

      <Button
        type="button"
        variant="ghost"
        className="h-12 text-base"
        onClick={grams.onCancel}
      >
        {readOnly ? "Назад" : "Отмена"}
      </Button>
    </div>
  );
}
