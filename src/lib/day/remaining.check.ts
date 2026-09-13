import {
  formatRemainingLine,
  isFullTemplateGap,
  mealsMatchRecipe,
  remainingFills,
  remainingRecipe,
} from "@/lib/day/remaining";
import type { MealType } from "@/lib/types";

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

function meal(
  mealType: MealType,
  items: Array<{
    food_id: string | null;
    name_snapshot: string;
    grams: number;
  }>,
) {
  return { meal_type: mealType, items };
}

assertEqual(
  remainingRecipe(recipe, [], false),
  [
    { name: "Овсянка сухая", grams: 50 },
    { name: "Куриное филе сырое", grams: 150 },
    { name: "Рис сухой", grams: 80 },
    { name: "Банан", grams: 120 },
  ],
  "full rest recipe",
);

assertEqual(
  remainingRecipe(recipe, [], true),
  [
    { name: "Овсянка сухая", grams: 50 },
    { name: "Куриное филе сырое", grams: 150 },
    { name: "Рис сухой", grams: 80 },
  ],
  "training hides snack",
);

assertEqual(
  remainingRecipe(
    recipe,
    [
      meal("lunch", [
        { food_id: "fillet", name_snapshot: "Куриное филе сырое", grams: 150 },
        { food_id: "rice", name_snapshot: "Рис сухой", grams: 80 },
      ]),
      meal("breakfast", [
        { food_id: "oats", name_snapshot: "Овсянка сухая", grams: 50 },
      ]),
    ],
    true,
  ),
  [],
  "fully logged",
);

assertEqual(
  remainingRecipe(
    recipe,
    [
      meal("lunch", [
        { food_id: "fillet", name_snapshot: "Куриное филе сырое", grams: 100 },
      ]),
    ],
    true,
  ),
  [
    { name: "Овсянка сухая", grams: 50 },
    { name: "Куриное филе сырое", grams: 50 },
    { name: "Рис сухой", grams: 80 },
  ],
  "partial fillet",
);

assertEqual(
  remainingFills(
    recipe,
    [
      meal("lunch", [
        { food_id: "fillet", name_snapshot: "Куриное филе сырое", grams: 100 },
      ]),
    ],
    true,
  ),
  [
    {
      mealType: "breakfast",
      foodId: "oats",
      name: "Овсянка сухая",
      grams: 50,
    },
    {
      mealType: "lunch",
      foodId: "fillet",
      name: "Куриное филе сырое",
      grams: 50,
    },
    { mealType: "lunch", foodId: "rice", name: "Рис сухой", grams: 80 },
  ],
  "partial fillet by meal",
);

assertEqual(
  remainingRecipe(
    recipe,
    [meal("lunch", [{ food_id: null, name_snapshot: "Рис сухой", grams: 80 }])],
    true,
  ),
  [
    { name: "Овсянка сухая", grams: 50 },
    { name: "Куриное филе сырое", grams: 150 },
  ],
  "null food id matches name",
);

assertEqual(
  remainingRecipe(
    [
      { foodId: "rice", name: "Рис сухой", grams: 40, mealType: "lunch" },
      { foodId: "rice", name: "Рис сухой", grams: 40, mealType: "dinner" },
    ],
    [
      meal("lunch", [
        { food_id: "rice", name_snapshot: "Рис сухой", grams: 30 },
      ]),
    ],
    false,
  ),
  [{ name: "Рис сухой", grams: 50 }],
  "same food across meals",
);

assertEqual(
  remainingFills(
    [
      { foodId: "rice", name: "Рис сухой", grams: 40, mealType: "lunch" },
      { foodId: "rice", name: "Рис сухой", grams: 40, mealType: "dinner" },
    ],
    [
      meal("lunch", [
        { food_id: "rice", name_snapshot: "Рис сухой", grams: 30 },
      ]),
    ],
    false,
  ),
  [
    { mealType: "lunch", foodId: "rice", name: "Рис сухой", grams: 10 },
    { mealType: "dinner", foodId: "rice", name: "Рис сухой", grams: 40 },
  ],
  "same food shortfall stays in meals",
);

assertEqual(
  remainingFills(
    [
      { foodId: "rice", name: "Рис сухой", grams: 40, mealType: "lunch" },
      { foodId: "rice", name: "Рис сухой", grams: 40, mealType: "dinner" },
    ],
    [
      meal("lunch", [
        { food_id: "rice", name_snapshot: "Рис сухой", grams: 50 },
      ]),
    ],
    false,
  ),
  [{ mealType: "dinner", foodId: "rice", name: "Рис сухой", grams: 30 }],
  "extra in one meal reduces later meals",
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

assertEqual(
  isFullTemplateGap(recipe, remainingFills(recipe, [], true), true),
  true,
  "empty is full gap",
);
assertEqual(
  isFullTemplateGap(
    recipe,
    remainingFills(
      recipe,
      [
        meal("lunch", [
          {
            food_id: "fillet",
            name_snapshot: "Куриное филе сырое",
            grams: 100,
          },
        ]),
      ],
      true,
    ),
    true,
  ),
  false,
  "partial is not full gap",
);
assertEqual(
  isFullTemplateGap(
    recipe,
    remainingFills(
      recipe,
      [
        meal("breakfast", [
          { food_id: "custom", name_snapshot: "Кофе", grams: 200 },
        ]),
      ],
      true,
    ),
    true,
  ),
  true,
  "custom-only is full gap",
);

assertEqual(mealsMatchRecipe([], []), true, "empty matches empty");
assertEqual(
  mealsMatchRecipe(
    [
      meal("breakfast", [
        { food_id: "oats", name_snapshot: "Овсянка сухая", grams: 50 },
      ]),
      meal("lunch", [
        { food_id: "fillet", name_snapshot: "Куриное филе сырое", grams: 150 },
        { food_id: "rice", name_snapshot: "Рис сухой", grams: 80 },
      ]),
      meal("snack", [{ food_id: "snack", name_snapshot: "Банан", grams: 120 }]),
    ],
    recipe,
  ),
  true,
  "logged rest template matches",
);
assertEqual(
  mealsMatchRecipe(
    [
      meal("breakfast", [
        { food_id: "oats", name_snapshot: "Овсянка сухая", grams: 50 },
      ]),
    ],
    recipe,
  ),
  false,
  "missing meals is edited",
);
assertEqual(
  mealsMatchRecipe(
    [
      meal("breakfast", [
        { food_id: "oats", name_snapshot: "Овсянка сухая", grams: 40 },
      ]),
      meal("lunch", [
        { food_id: "fillet", name_snapshot: "Куриное филе сырое", grams: 150 },
        { food_id: "rice", name_snapshot: "Рис сухой", grams: 80 },
      ]),
      meal("snack", [{ food_id: "snack", name_snapshot: "Банан", grams: 120 }]),
    ],
    recipe,
  ),
  false,
  "gram change is edited",
);
assertEqual(
  mealsMatchRecipe(
    [meal("lunch", [{ food_id: null, name_snapshot: "Каша", grams: 200 }])],
    [],
  ),
  false,
  "lump is edited",
);
assertEqual(
  mealsMatchRecipe(
    [
      meal("breakfast", [
        { food_id: "oats", name_snapshot: "Овсянка сухая", grams: 50 },
      ]),
      meal("lunch", [
        { food_id: "fillet", name_snapshot: "Куриное филе сырое", grams: 150 },
        { food_id: "rice", name_snapshot: "Рис сухой", grams: 80 },
      ]),
      meal("snack", [{ food_id: "snack", name_snapshot: "Банан", grams: 120 }]),
      meal("dinner", [
        { food_id: "extra", name_snapshot: "Творог", grams: 100 },
      ]),
    ],
    recipe,
  ),
  false,
  "extra food is edited",
);
assertEqual(mealsMatchRecipe([], recipe), false, "cleared day is edited");

console.log("remaining recipe ok");
