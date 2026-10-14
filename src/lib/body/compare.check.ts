import {
  averageSide,
  bodyCompareCaption,
  compareLifts,
} from "@/lib/body/compare";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

const thenSide = averageSide([
  { body_weight: 82, waist_cm: 86, fact_kcal: 2100 },
  { body_weight: 83, waist_cm: null, fact_kcal: 0 },
]);
const nowSide = averageSide([
  { body_weight: 80, waist_cm: 84, fact_kcal: 1900 },
]);

assertEqual(thenSide.weight, 82.5, "weight averages the logged days");
assertEqual(thenSide.kcal, 2100, "empty kcal days stay out");

const caption = bodyCompareCaption({
  before: thenSide,
  now: nowSide,
  lifts: compareLifts(
    [
      { name: "жим лёжа", weight: 80 },
      { name: "присед", weight: 100 },
    ],
    [
      { name: "жим лёжа", weight: 85 },
      { name: "присед", weight: 110 },
    ],
  ),
});
assertEqual(caption?.includes("82,5 → 80 кг"), true, "weight change");
assertEqual(caption?.includes("талия 86 → 84"), true, "waist change");
assertEqual(caption?.includes("ккал"), true, "kcal change");
assertEqual(
  (caption?.indexOf("присед") ?? -1) < (caption?.indexOf("жим лёжа") ?? -1),
  true,
  "heavier lift first",
);
