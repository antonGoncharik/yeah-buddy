"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  type FoodYield,
  formatYieldGrams,
  type GramsMode,
  nativeYieldLabel,
  parseGramsInput,
  switchGramsMode,
  toNativeGrams,
} from "@/lib/food/yield";
import { gramsChipForMode, yieldEquivalentLabel } from "@/lib/food/yield-copy";
import { LOAD_FAILED } from "@/lib/messages";
import { calcMacrosFromPer100 } from "@/lib/nutrition";
import { haptic } from "@/lib/telegram/haptic";
import type { FoodState } from "@/lib/types";

export function useGramsScreen({
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

  const pair = allowCooked && yieldPair != null ? yieldPair : null;
  const grams = parseGramsInput(gramsInput) ?? 0;
  const nativeGrams = toNativeGrams(grams, gramsMode, pair);
  const nativeLabel = nativeYieldLabel(foodState ?? "raw");
  const totals = useMemo(() => {
    if (!(nativeGrams > 0)) {
      return null;
    }

    return calcMacrosFromPer100({ protein, fat, carbs, kcal }, nativeGrams);
  }, [carbs, fat, kcal, nativeGrams, protein]);
  const chip = gramsChipForMode(
    gramsMode,
    pair,
    defaultPortionG,
    defaultPortionLabel,
  );

  function changeMode(next: GramsMode) {
    if (next === gramsMode || !pair) {
      return;
    }
    if (grams > 0) {
      setGramsInput(
        formatYieldGrams(switchGramsMode(grams, gramsMode, next, pair)),
      );
    }
    setGramsMode(next);
  }

  async function onSave() {
    if (readOnly || !save) {
      return;
    }

    if (!(nativeGrams > 0)) {
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

  return {
    gramsInput,
    setGramsInput,
    gramsMode,
    pair,
    nativeGrams,
    nativeLabel,
    equivalentLabel: pair
      ? yieldEquivalentLabel(nativeGrams, gramsMode, pair, nativeLabel)
      : "",
    chip,
    totals,
    error,
    saving,
    changeMode,
    onSave,
    onCancel: () => router.push(readOnly ? doneHref : backHref),
  };
}
