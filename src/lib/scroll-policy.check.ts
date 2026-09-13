import { shouldResetWindowScroll } from "@/lib/scroll-policy";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${String(actual)}, expected ${String(expected)}`,
    );
  }
}

assertEqual(
  shouldResetWindowScroll("/today/meals/m1/add"),
  true,
  "today add picker",
);
assertEqual(
  shouldResetWindowScroll("/today/meals/m1/add/food-1"),
  true,
  "today grams",
);
assertEqual(
  shouldResetWindowScroll("/today/meals/m1/add/lump"),
  true,
  "today lump",
);
assertEqual(
  shouldResetWindowScroll("/today/meals/m1/plate"),
  true,
  "today plate",
);
assertEqual(
  shouldResetWindowScroll("/settings/meals/training/lunch/add"),
  true,
  "template add picker",
);
assertEqual(
  shouldResetWindowScroll("/settings/meals/rest/dinner/add/food-1"),
  true,
  "template grams",
);
assertEqual(shouldResetWindowScroll("/food/new"), true, "new food");

assertEqual(shouldResetWindowScroll("/today"), false, "today");
assertEqual(shouldResetWindowScroll("/today/history"), false, "history");
assertEqual(shouldResetWindowScroll("/today/week"), false, "week");
assertEqual(
  shouldResetWindowScroll("/today/items/item-1"),
  false,
  "edit logged item",
);
assertEqual(shouldResetWindowScroll("/foods"), false, "foods catalog");
assertEqual(shouldResetWindowScroll("/food/abc"), false, "edit food");
assertEqual(shouldResetWindowScroll("/settings"), false, "settings");
assertEqual(
  shouldResetWindowScroll("/settings/meals/training"),
  false,
  "meal templates",
);
assertEqual(shouldResetWindowScroll("/workouts"), false, "workouts");
assertEqual(
  shouldResetWindowScroll("/workouts/exercises"),
  false,
  "exercises list",
);
assertEqual(
  shouldResetWindowScroll("/workouts/history"),
  false,
  "workout history",
);

console.log("scroll policy ok");
