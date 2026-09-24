import {
  readAccountAgeDays,
  readDayWritable,
  readLastBodyWeight,
  readLastWaist,
  readLastWaistDate,
  readMacroGoals,
  readPriorProteinHits,
  readRetentionTail,
  readReviewReady,
  readWeightSteady,
  readYesterdayMealTypes,
} from "@/lib/day/today-payload";
import {
  filledMealTypes,
  mealExistsReplace,
  shareMealLine,
} from "@/lib/nutrition";

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

assertEqual(shareMealLine("lunch"), "Отправить в чат", "lunch share");
assertEqual(
  shareMealLine("pre_workout"),
  "Отправить в чат",
  "pre workout share",
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
assertEqual(readLastWaist({ lastWaist: 84 }), 84, "last waist");
assertEqual(readLastWaist({}), null, "missing last waist");
assertEqual(
  readLastWaistDate({ lastWaistDate: "2026-08-01" }),
  "2026-08-01",
  "last waist date",
);
assertEqual(
  readLastWaistDate({ lastWaistDate: "nope" }),
  null,
  "bad waist date",
);
assertEqual(readAccountAgeDays({ accountAgeDays: 21 }), 21, "account age");
assertEqual(readAccountAgeDays({ accountAgeDays: -1 }), null, "negative age");
assertEqual(
  readMacroGoals({
    goals: {
      restProtein: 130,
      restCarbs: 180,
      trainingProtein: 150,
      trainingCarbs: 240,
    },
  }).trainingCarbs,
  240,
  "training carbs",
);
assertEqual(readMacroGoals({}).restProtein, 120, "goals fall back");
assertEqual(readWeightSteady({ weightSteady: true }), true, "steady flag");
assertEqual(readWeightSteady({}), false, "missing steady is false");
assertEqual(readPriorProteinHits({ priorProteinHits: 4 }), 4, "prior hits");
assertEqual(readPriorProteinHits({}), 0, "missing prior hits");
assertEqual(
  readPriorProteinHits({ priorProteinHits: 1.5 }),
  0,
  "fraction drops",
);
assertEqual(readReviewReady({ reviewReady: true }), true, "review ready");
assertEqual(readReviewReady({}), false, "missing review ready");
assertEqual(readRetentionTail({ retentionTail: true }), true, "retention tail");
assertEqual(readRetentionTail({}), false, "missing retention tail");
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
  true,
  "fallback keeps day before yesterday writable",
);
assertEqual(
  readDayWritable({}, "2026-09-09", "2026-09-12"),
  true,
  "fallback keeps catch-up window writable",
);
assertEqual(
  readDayWritable({}, "2026-09-04", "2026-09-12"),
  false,
  "fallback locks older than a week",
);

console.log("copy yesterday meal ok");
