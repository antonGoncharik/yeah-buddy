import { closeDayCombo } from "@/lib/nutrition/close-day";
import type { ProteinCloseCandidate } from "@/lib/nutrition/protein-close";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

function food(
  id: string,
  name: string,
  protein: number,
  grams: number,
): ProteinCloseCandidate {
  return {
    id,
    name,
    proteinPer100: protein,
    fatPer100: 2,
    carbsPer100: 4,
    kcalPer100: protein * 4 + 2 * 9 + 4 * 4,
    portionGrams: grams,
    favorite: true,
    recentRank: 0,
  };
}

const combo = closeDayCombo({ remainingProtein: 40, remainingKcal: 400 }, [
  food("curd", "Творог", 18, 150),
  food("apple", "Яблоко", 0.3, 150),
  food("egg", "Яйца", 13, 100),
]);
assertEqual(
  combo?.pieces.map((piece) => piece.foodId),
  ["curd", "egg"],
  "two protein foods",
);
assertEqual(
  closeDayCombo({ remainingProtein: 4, remainingKcal: 400 }, [
    food("curd", "Творог", 18, 150),
  ]),
  null,
  "a closed protein target needs no combo",
);
