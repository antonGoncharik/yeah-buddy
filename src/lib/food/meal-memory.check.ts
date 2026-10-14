import {
  todayOtherMealChips,
  yesterdayMealChips,
} from "@/lib/food/meal-memory";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(
  yesterdayMealChips({
    mealType: "breakfast",
    todayFoodIds: ["oats"],
    yesterday: [
      { foodId: "oats", name: "Овсянка", grams: 155, mealType: "breakfast" },
      { foodId: "eggs", name: "Яйца", grams: 115, mealType: "breakfast" },
      { foodId: "rice", name: "Рис", grams: 130, mealType: "lunch" },
      { foodId: null, name: "Что-то", grams: 50, mealType: "breakfast" },
    ],
  }).map((chip) => chip.label),
  ["Вчера · Яйца · 115 г"],
  "same meal, not already eaten, not another meal",
);
assertEqual(
  todayOtherMealChips({
    mealType: "dinner",
    today: [
      { foodId: "rice", name: "Рис", grams: 135, mealType: "lunch" },
      { foodId: "rice", name: "Рис", grams: 100, mealType: "dinner" },
      { foodId: "apple", name: "Яблоко", grams: 150, mealType: "snack" },
    ],
  }).map((chip) => chip.label),
  ["Сегодня · Яблоко · 150 г"],
  "other meals today, not what this plate already has",
);
