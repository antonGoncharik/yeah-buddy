"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { GramChips } from "@/components/day/gram-chips";
import { GramsYieldToggle } from "@/components/day/grams-yield-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { patchJson, postJson } from "@/lib/api-cache";
import {
  type FoodYield,
  formatYieldGrams,
  type GramsMode,
  nativeYieldLabel,
  toCookedGrams,
  toNativeGrams,
} from "@/lib/food/yield";
import { LOAD_FAILED } from "@/lib/messages";
import { calcMacrosFromPer100, formatKcal, formatMacro } from "@/lib/nutrition";
import { haptic } from "@/lib/telegram/haptic";
import type { FoodState } from "@/lib/types";

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
  const router = useRouter();
  const [gramsInput, setGramsInput] = useState(String(initialGrams));
  const [gramsMode, setGramsMode] = useState<GramsMode>("native");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canCooked = allowCooked && yieldPair != null;
  const pair = canCooked ? yieldPair : null;
  const grams = Number(gramsInput.replace(",", "."));
  const nativeGrams = toNativeGrams(
    Number.isFinite(grams) ? grams : 0,
    gramsMode,
    pair,
  );
  const totals = useMemo(() => {
    if (!(nativeGrams > 0)) {
      return null;
    }

    return calcMacrosFromPer100({ protein, fat, carbs, kcal }, nativeGrams);
  }, [carbs, fat, kcal, nativeGrams, protein]);

  const cookedPortion =
    pair && defaultPortionG && defaultPortionG > 0
      ? toCookedGrams(defaultPortionG, pair)
      : null;
  const chipPortionG =
    gramsMode === "cooked" && cookedPortion != null
      ? cookedPortion
      : defaultPortionG;
  const chipPortionLabel =
    gramsMode === "cooked" && cookedPortion != null
      ? `${formatYieldGrams(cookedPortion)} г готового`
      : defaultPortionLabel;

  function changeMode(next: GramsMode) {
    if (next === gramsMode || !pair) {
      return;
    }
    if (Number.isFinite(grams) && grams > 0) {
      const native = toNativeGrams(grams, gramsMode, pair);
      const shown = next === "cooked" ? toCookedGrams(native, pair) : native;
      setGramsInput(formatYieldGrams(shown));
    }
    setGramsMode(next);
  }

  async function onSave() {
    if (readOnly || !save) {
      return;
    }

    if (!Number.isFinite(grams) || !(nativeGrams > 0)) {
      haptic("warn");
      setError("Нужны граммы больше 0.");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      await save(nativeGrams);
      haptic("success");
      router.push(doneHref);
      router.refresh();
    } catch (caught) {
      haptic("error");
      setError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setSaving(false);
    }
  }

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
          <p className="text-2xl font-semibold tabular-nums">{gramsInput}</p>
        ) : (
          <Input
            inputMode="decimal"
            value={gramsInput}
            onChange={(event) => setGramsInput(event.target.value)}
            className="h-14 text-lg"
          />
        )}
      </div>

      {pair ? (
        <GramsYieldToggle
          mode={gramsMode}
          nativeLabel={nativeYieldLabel(foodState ?? "raw")}
          equivalentLabel={
            nativeGrams > 0
              ? gramsMode === "cooked"
                ? `${formatYieldGrams(nativeGrams)} г ${nativeYieldLabel(foodState ?? "raw").toLowerCase()}`
                : `${formatYieldGrams(toCookedGrams(nativeGrams, pair))} г готового`
              : pair
                ? `${formatYieldGrams(pair.from_g)} → ${formatYieldGrams(pair.to_g)}`
                : ""
          }
          disabled={readOnly}
          onChange={changeMode}
        />
      ) : null}

      {totals ? (
        <div className="card-surface px-5 py-4 text-lg">
          Итого: Б {formatMacro(totals.protein)} · Ж {formatMacro(totals.fat)} ·
          У {formatMacro(totals.carbs)} · {formatKcal(totals.kcal)} ккал
        </div>
      ) : null}

      {readOnly ? null : (
        <GramChips
          onPick={(value) => setGramsInput(formatYieldGrams(value))}
          defaultPortionG={chipPortionG}
          defaultPortionLabel={chipPortionLabel}
        />
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {readOnly ? null : (
        <Button
          className="h-14 text-lg"
          disabled={saving}
          onClick={() => void onSave()}
        >
          {saving ? "Сохранение…" : "Сохранить"}
        </Button>
      )}

      <Button
        type="button"
        variant="ghost"
        className="h-12 text-base"
        onClick={() => router.push(readOnly ? doneHref : backHref)}
      >
        {readOnly ? "Назад" : "Отмена"}
      </Button>
    </div>
  );
}

export async function saveMealItemGrams(itemId: string, grams: number) {
  await patchJson(`/api/meal-items/${itemId}`, { grams });
}

export async function addMealItemGrams(
  mealId: string,
  foodId: string,
  grams: number,
) {
  await postJson(`/api/meals/${mealId}/items`, { foodId, grams });
}

export async function addTemplateItemGrams(
  dayType: string,
  mealType: string,
  foodId: string,
  grams: number,
) {
  await postJson(`/api/meal-templates/${dayType}/items`, {
    mealType,
    foodId,
    grams,
  });
}

export async function saveTemplateItemGrams(itemId: string, grams: number) {
  await patchJson(`/api/meal-template-items/${itemId}`, { grams });
}
