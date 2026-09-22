import { readStarterOnly } from "@/lib/food/map";
import {
  isStarterDayMenu,
  isStarterFoodList,
  STARTER_FOODS,
  STARTER_MEAL_TEMPLATES,
} from "@/lib/food/starter";
import type { DayType, MealType } from "@/lib/types";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

const starterName = STARTER_FOODS[0]?.name ?? "";

assertEqual(
  isStarterFoodList([{ name: starterName }]),
  true,
  "starter names only",
);
assertEqual(
  isStarterFoodList(STARTER_FOODS.map((item) => ({ name: item.name }))),
  true,
  "full starter list",
);
assertEqual(isStarterFoodList([]), false, "empty is not a starter set");
assertEqual(
  isStarterFoodList([{ name: starterName }, { name: "Простоквашино" }]),
  false,
  "extra name leaves the starter set",
);
assertEqual(
  isStarterFoodList([{ name: starterName, catalogFoodId: "catalog-1" }]),
  false,
  "catalog copy leaves the starter set",
);
assertEqual(
  isStarterFoodList([{ name: starterName, catalogFoodId: "" }]),
  true,
  "blank catalog id still counts",
);
assertEqual(readStarterOnly({ starterOnly: true }), true, "flag on");
assertEqual(readStarterOnly({ starterOnly: false }), false, "flag off");
assertEqual(readStarterOnly({ foods: [] }), false, "missing flag");
assertEqual(readStarterOnly(null), false, "null payload");

function starterMenu(dayType: DayType) {
  const template = STARTER_MEAL_TEMPLATES.find(
    (item) => item.dayType === dayType,
  );
  const byMeal = new Map<MealType, string[]>();
  for (const item of template?.items ?? []) {
    const names = byMeal.get(item.mealType) ?? [];
    names.push(item.foodName);
    byMeal.set(item.mealType, names);
  }
  return [...byMeal.entries()].map(([mealType, names]) => ({
    mealType,
    names,
  }));
}

assertEqual(
  isStarterDayMenu(starterMenu("rest"), "rest"),
  true,
  "rest example",
);
assertEqual(
  isStarterDayMenu(starterMenu("training"), "training"),
  true,
  "training example",
);
assertEqual(
  isStarterDayMenu(starterMenu("rest"), "training"),
  false,
  "rest menu is not a training day",
);
assertEqual(
  isStarterDayMenu([], "rest"),
  false,
  "empty day is not the example",
);
const restPlus = starterMenu("rest");
const breakfast = restPlus.find((meal) => meal.mealType === "breakfast");
if (!breakfast) {
  throw new Error("starter breakfast missing");
}
breakfast.names.push("Банан");
assertEqual(
  isStarterDayMenu(restPlus, "rest"),
  false,
  "an extra product leaves the example",
);

console.log("starter food list ok");
