"use client";

import { GramChips } from "@/components/day/gram-chips";
import { GramsYieldToggle } from "@/components/day/grams-yield-toggle";
import { useGramsScreen } from "@/components/day/use-grams-screen";
import { StickyActions } from "@/components/layout/sticky-actions";
import { Button } from "@/components/ui/button";
import { GramsStepperInput } from "@/components/ui/grams-stepper";
import type { FoodYield } from "@/lib/food/yield";
import { formatYieldGrams } from "@/lib/food/yield";
import { formatKcal, formatMacro } from "@/lib/nutrition";
import type { FoodState } from "@/lib/types";

export {
  addLumpMealItem,
  addMealItemGrams,
  addTemplateItemGrams,
  saveLumpMealItem,
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
    <form
      className="animate-rise flex flex-col gap-5 px-4 pb-[var(--app-field-scroll-pad)]"
      onSubmit={(event) => {
        event.preventDefault();
        if (!readOnly) {
          void grams.onSave();
        }
      }}
    >
      <div>
        <p className="text-2xl font-semibold tracking-tight">{name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          На 100 г: Б {formatMacro(protein)} · Ж {formatMacro(fat)} · У{" "}
          {formatMacro(carbs)} · {formatKcal(kcal)} ккал
        </p>
      </div>

      <div className="flex items-center gap-2">
        {readOnly ? (
          <p className="min-w-0 flex-1 text-center text-3xl font-semibold tabular-nums">
            {grams.gramsInput}
            <span className="ml-1 text-lg font-medium text-muted-foreground">
              г
            </span>
          </p>
        ) : (
          <GramsStepperInput
            value={grams.gramsInput}
            onChange={grams.setGramsInput}
            aria-invalid={grams.error ? true : undefined}
          />
        )}
      </div>

      {grams.totals ? (
        <div className="card-surface flex flex-col gap-1 px-5 py-4">
          <p className="text-3xl font-semibold tracking-tight tabular-nums">
            {formatKcal(grams.totals.kcal)}
            <span className="ml-1.5 text-base font-medium text-muted-foreground">
              ккал
            </span>
          </p>
          <p className="text-sm text-muted-foreground tabular-nums">
            Б {formatMacro(grams.totals.protein)} · Ж{" "}
            {formatMacro(grams.totals.fat)} · У{" "}
            {formatMacro(grams.totals.carbs)}
          </p>
        </div>
      ) : null}

      {grams.pair ? (
        <GramsYieldToggle
          mode={grams.gramsMode}
          nativeLabel={grams.nativeLabel}
          equivalentLabel={grams.equivalentLabel}
          disabled={readOnly}
          onChange={grams.changeMode}
        />
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
        <StickyActions>
          <Button type="submit" className="h-14 text-lg">
            Сохранить
          </Button>
        </StickyActions>
      )}
    </form>
  );
}
