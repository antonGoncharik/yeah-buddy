import type { MealType } from "@/lib/types";

export interface MemoryItem {
  foodId: string | null;
  name: string;
  grams: number;
  mealType: MealType;
}

export interface MemoryChip {
  foodId: string;
  name: string;
  grams: number;
  label: string;
}

/** Yesterday's portions for this meal, skipping foods already on today's plate. */
export function yesterdayMealChips(input: {
  mealType: MealType;
  yesterday: readonly MemoryItem[];
  todayFoodIds: readonly string[];
}): MemoryChip[] {
  const taken = new Set(input.todayFoodIds);
  const chips: MemoryChip[] = [];
  for (const item of input.yesterday) {
    if (item.mealType !== input.mealType || !item.foodId || !(item.grams > 0)) {
      continue;
    }
    if (
      taken.has(item.foodId) ||
      chips.some((chip) => chip.foodId === item.foodId)
    ) {
      continue;
    }
    chips.push({
      foodId: item.foodId,
      name: item.name,
      grams: item.grams,
      label: `Вчера · ${item.name} · ${formatChipGrams(item.grams)} г`,
    });
    if (chips.length >= 4) {
      break;
    }
  }
  return chips;
}

function formatChipGrams(grams: number): string {
  const rounded = Math.round(grams * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
