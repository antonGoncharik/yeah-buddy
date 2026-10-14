import {
  recipeCookedGrams,
  recipePer100,
  recipePortion,
  recipeRawGrams,
} from "@/lib/food/recipe";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

const lines = [
  { grams: 200, proteinPer100: 20, fatPer100: 5, carbsPer100: 0 },
  { grams: 50, proteinPer100: 0, fatPer100: 100, carbsPer100: 0 },
];

assertEqual(recipeRawGrams(lines), 250, "raw sum");
assertEqual(
  recipeCookedGrams({ rawGrams: 250, cookedGrams: null, shrinkPercent: 20 }),
  200,
  "fried down 20 percent",
);
assertEqual(
  recipeCookedGrams({ rawGrams: 250, cookedGrams: 400, shrinkPercent: 20 }),
  400,
  "typed cooked weight wins over shrink",
);
assertEqual(
  recipeCookedGrams({ rawGrams: 250, cookedGrams: 10, shrinkPercent: null }),
  null,
  "cooked weight far below the pot is rejected",
);

const per100 = recipePer100(lines, 200);
assertEqual(per100?.protein, 20, "protein concentrates when it fries");
assertEqual(per100?.fat, 30, "oil stays in the pot");
assertEqual(per100?.kcal, 350, "kcal follows 4/4/9");
assertEqual(
  recipePortion(400, 2),
  { grams: 200, label: "1/2 кастрюли" },
  "half the pot",
);
assertEqual(recipePortion(400, 0), null, "no empty servings");
