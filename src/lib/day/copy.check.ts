import {
  readDayWritable,
  readLastBodyWeight,
  readYesterdayMealTypes,
} from "@/lib/day/today-payload";
import { filledMealTypes, mealExistsReplace } from "@/lib/nutrition";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

assertEqual(
  filledMealTypes([
    { meal_type: "breakfast", items: [{ id: "1" }] },
    { meal_type: "lunch", items: [] },
    { meal_type: "dinner", items: [{ id: "2" }, { id: "3" }] },
  ]),
  ["breakfast", "dinner"],
  "only meals with items",
);

assertEqual(filledMealTypes([]), [], "empty meals");

assertEqual(mealExistsReplace("breakfast"), "Заменить завтрак?", "breakfast");
assertEqual(
  mealExistsReplace("pre_workout"),
  "Заменить до тренировки?",
  "pre workout",
);

assertEqual(
  readYesterdayMealTypes({
    yesterdayMealTypes: ["breakfast", "nope", "lunch"],
  }),
  ["breakfast", "lunch"],
  "payload filters meal types",
);
assertEqual(readYesterdayMealTypes({}), [], "missing payload");
assertEqual(readYesterdayMealTypes({ yesterdayExists: true }), [], "no types");

assertEqual(
  readLastBodyWeight({ lastBodyWeight: 82.4 }),
  82.4,
  "last body weight",
);
assertEqual(readLastBodyWeight({}), null, "missing last weight");
assertEqual(
  readDayWritable({ writable: true }, "2026-09-10", "2026-09-12"),
  true,
  "payload writable wins",
);
assertEqual(
  readDayWritable({}, "2026-09-11", "2026-09-12"),
  true,
  "fallback keeps yesterday writable",
);
assertEqual(
  readDayWritable({}, "2026-09-10", "2026-09-12"),
  false,
  "fallback locks older day",
);

console.log("copy yesterday meal ok");
