import {
  type FoodYield,
  formatYieldGrams,
  type GramsMode,
  toCookedGrams,
} from "@/lib/food/yield";

export function yieldEquivalentLabel(
  nativeGrams: number,
  mode: GramsMode,
  pair: FoodYield,
  nativeLabel: string,
): string {
  if (nativeGrams > 0) {
    return mode === "cooked"
      ? `${formatYieldGrams(nativeGrams)} г ${nativeLabel.toLowerCase()}`
      : `${formatYieldGrams(toCookedGrams(nativeGrams, pair))} г готового`;
  }

  return `${formatYieldGrams(pair.from_g)} → ${formatYieldGrams(pair.to_g)}`;
}

export function cookedPortionGrams(
  nativePortion: number | null | undefined,
  pair: FoodYield | null,
): number | null {
  if (!pair || nativePortion == null || !(nativePortion > 0)) {
    return null;
  }

  return toCookedGrams(nativePortion, pair);
}

export function gramsChipForMode(
  mode: GramsMode,
  pair: FoodYield | null,
  defaultPortionG: number | null | undefined,
  defaultPortionLabel: string | null | undefined,
): {
  grams: number | null | undefined;
  label: string | null | undefined;
} {
  const cooked = cookedPortionGrams(defaultPortionG, pair);
  if (mode === "cooked" && cooked != null) {
    return {
      grams: cooked,
      label: `${formatYieldGrams(cooked)} г готового`,
    };
  }

  return { grams: defaultPortionG, label: defaultPortionLabel };
}
