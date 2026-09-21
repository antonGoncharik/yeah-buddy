import { readStarterOnly } from "@/lib/food/map";
import { isStarterFoodList, STARTER_FOODS } from "@/lib/food/starter";

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

console.log("starter food list ok");
