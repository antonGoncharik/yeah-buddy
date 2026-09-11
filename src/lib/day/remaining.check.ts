import { formatRemainingLine, remainingRecipe } from "@/lib/day/remaining";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

const recipe = [
  {
    foodId: "fillet",
    name: "Куриное филе сырое",
    grams: 150,
    mealType: "lunch" as const,
  },
  { foodId: "rice", name: "Рис сухой", grams: 80, mealType: "lunch" as const },
  {
    foodId: "oats",
    name: "Овсянка сухая",
    grams: 50,
    mealType: "breakfast" as const,
  },
  { foodId: "snack", name: "Банан", grams: 120, mealType: "snack" as const },
];

assertEqual(
  remainingRecipe(recipe, [], false),
  [
    { name: "Куриное филе сырое", grams: 150 },
    { name: "Рис сухой", grams: 80 },
    { name: "Овсянка сухая", grams: 50 },
    { name: "Банан", grams: 120 },
  ],
  "full rest recipe",
);

assertEqual(
  remainingRecipe(recipe, [], true),
  [
    { name: "Куриное филе сырое", grams: 150 },
    { name: "Рис сухой", grams: 80 },
    { name: "Овсянка сухая", grams: 50 },
  ],
  "training hides snack",
);

assertEqual(
  remainingRecipe(
    recipe,
    [
      { food_id: "fillet", name_snapshot: "Куриное филе сырое", grams: 150 },
      { food_id: "rice", name_snapshot: "Рис сухой", grams: 80 },
      { food_id: "oats", name_snapshot: "Овсянка сухая", grams: 50 },
    ],
    true,
  ),
  [],
  "fully logged",
);

assertEqual(
  remainingRecipe(
    recipe,
    [{ food_id: "fillet", name_snapshot: "Куриное филе сырое", grams: 100 }],
    true,
  ),
  [
    { name: "Куриное филе сырое", grams: 50 },
    { name: "Рис сухой", grams: 80 },
    { name: "Овсянка сухая", grams: 50 },
  ],
  "partial fillet",
);

assertEqual(
  remainingRecipe(
    recipe,
    [{ food_id: null, name_snapshot: "Рис сухой", grams: 80 }],
    true,
  ),
  [
    { name: "Куриное филе сырое", grams: 150 },
    { name: "Овсянка сухая", grams: 50 },
  ],
  "null food id matches name",
);

assertEqual(
  remainingRecipe(
    [
      { foodId: "rice", name: "Рис сухой", grams: 40, mealType: "lunch" },
      { foodId: "rice", name: "Рис сухой", grams: 40, mealType: "dinner" },
    ],
    [{ food_id: "rice", name_snapshot: "Рис сухой", grams: 30 }],
    false,
  ),
  [{ name: "Рис сухой", grams: 50 }],
  "same food across meals",
);

assertEqual(
  formatRemainingLine([
    { name: "Куриное филе сырое", grams: 150 },
    { name: "Рис сухой", grams: 80.4 },
  ]),
  "Ещё Куриное филе сырое 150 г, Рис сухой 80 г",
  "remaining sentence",
);

assertEqual(formatRemainingLine([]), null, "empty remaining");

console.log("remaining recipe ok");
