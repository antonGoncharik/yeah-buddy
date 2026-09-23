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
import { sanitizeDecimalDraft } from "@/lib/form/numeric-draft";
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
    haptic("commit");
    const pending = save(nativeGrams);
    router.push(doneHref);
    void pending;
  }

  return {
    gramsInput,
    setGramsInput: (value: string) => {
      setError(null);
      setGramsInput(sanitizeDecimalDraft(value));
    },
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
    changeMode,
    onSave,
    onCancel: () => router.push(readOnly ? doneHref : backHref),
  };
}
