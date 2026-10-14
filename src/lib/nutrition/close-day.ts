import { calcKcalFromMacros } from "@/lib/nutrition";
import type { ProteinCloseCandidate } from "@/lib/nutrition/protein-close";

export interface CloseDayPiece {
  foodId: string;
  name: string;
  grams: number;
}

export interface CloseDayCombo {
  pieces: [CloseDayPiece, CloseDayPiece];
  protein: number;
  kcal: number;
}

/** Two usual portions that together fit the leftover calories and beat one food. */
export function closeDayCombo(
  budget: { remainingProtein: number; remainingKcal: number },
  foods: readonly ProteinCloseCandidate[],
): CloseDayCombo | null {
  if (!(budget.remainingProtein >= 8) || !(budget.remainingKcal >= 120)) {
    return null;
  }
  const usable = foods.filter(
    (food) => food.portionGrams != null && food.portionGrams > 0,
  );
  let bestSingle = 0;
  for (const food of usable) {
    const grams = food.portionGrams ?? 0;
    const protein = (food.proteinPer100 * grams) / 100;
    const kcal = kcalOf(food, grams);
    if (kcal <= budget.remainingKcal * 1.1 && protein > bestSingle) {
      bestSingle = protein;
    }
  }

  let best: CloseDayCombo | null = null;
  const pool = usable.slice(0, 12);
  for (let left = 0; left < pool.length; left += 1) {
    for (let right = left + 1; right < pool.length; right += 1) {
      const first = piece(pool[left]);
      const second = piece(pool[right]);
      if (!first || !second || first.foodId === second.foodId) {
        continue;
      }
      const protein = first.protein + second.protein;
      const kcal = first.kcal + second.kcal;
      if (kcal > budget.remainingKcal * 1.1 || protein < bestSingle + 8) {
        continue;
      }
      if (best && (protein < best.protein || kcal > best.kcal)) {
        continue;
      }
      best = {
        pieces: [
          { foodId: first.foodId, name: first.name, grams: first.grams },
          { foodId: second.foodId, name: second.name, grams: second.grams },
        ],
        protein,
        kcal,
      };
    }
  }
  return best;
}

function piece(food: ProteinCloseCandidate): {
  foodId: string;
  name: string;
  grams: number;
  protein: number;
  kcal: number;
} | null {
  const grams = food.portionGrams;
  if (grams == null || !(grams > 0)) {
    return null;
  }
  return {
    foodId: food.id,
    name: food.name,
    grams,
    protein: (food.proteinPer100 * grams) / 100,
    kcal: kcalOf(food, grams),
  };
}

function kcalOf(food: ProteinCloseCandidate, grams: number): number {
  return calcKcalFromMacros(
    (food.proteinPer100 * grams) / 100,
    (food.fatPer100 * grams) / 100,
    (food.carbsPer100 * grams) / 100,
  );
}
