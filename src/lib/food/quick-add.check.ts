import { quickAddGrams, quickAddPortionLabel } from "@/lib/food/quick-add";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

const cottage = {
  default_portion_g: 150,
  default_portion_label: "1 пачка",
  state: "as_is" as const,
  yield_from_g: null,
  yield_to_g: null,
};

assertEqual(quickAddGrams(cottage), 150, "plain food uses the portion");
assertEqual(quickAddPortionLabel(cottage), "1 пачка", "label wins");
assertEqual(
  quickAddPortionLabel({ ...cottage, default_portion_label: null }),
  "150 г",
  "grams when the label is empty",
);

assertEqual(
  quickAddGrams({
    default_portion_g: 150,
    state: "raw",
    yield_from_g: 150,
    yield_to_g: 110,
  }),
  null,
  "yield stays on the grams screen",
);
assertEqual(
  quickAddGrams({
    default_portion_g: null,
    state: "as_is",
    yield_from_g: null,
    yield_to_g: null,
  }),
  null,
  "no portion",
);

console.log("food quick-add ok");
