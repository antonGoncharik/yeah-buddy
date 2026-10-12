import { ReviewError } from "@/lib/ai/errors";
import { requireMealParseItems } from "@/lib/ai/meal-parse-guard";
import type { PlateModelItem } from "@/lib/ai/plate-types";
import { AI_MEAL_PARSE_EMPTY_REFUND } from "@/lib/messages";

function assert(condition: boolean, label: string): void {
  if (!condition) {
    throw new Error(label);
  }
}

function item(name: string): PlateModelItem {
  return {
    catalog_i: -1,
    match: false,
    name,
    grams: 100,
    state: "cooked",
    protein: 10,
    fat: 5,
    carbs: 20,
    protein_per_100: null,
    fat_per_100: null,
    carbs_per_100: null,
  };
}

let threw = false;
try {
  requireMealParseItems([], [], "fail");
} catch (error) {
  threw = true;
  if (!(error instanceof ReviewError)) {
    throw new Error("empty raw is ReviewError");
  }
  assert(error.code === "EMPTY", "empty raw code");
  assert(error.message === AI_MEAL_PARSE_EMPTY_REFUND, "empty refund copy");
}
assert(threw, "empty raw throws");

threw = false;
try {
  requireMealParseItems([item("овсянка")], [], "fail");
} catch (error) {
  threw = true;
  assert(error instanceof ReviewError && error.code === "EMPTY", "no items");
}
assert(threw, "resolved empty throws");

const kept = requireMealParseItems([item("овсянка")], [{ id: 1 }], "fail");
assert(kept.length === 1, "non-empty passes");
