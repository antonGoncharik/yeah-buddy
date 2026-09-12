import {
  convertYieldGrams,
  formatYieldGrams,
  parseFoodYield,
  switchGramsMode,
  toCookedGrams,
  toNativeGrams,
} from "@/lib/food/yield";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${String(actual)}, expected ${String(expected)}`,
    );
  }
}

const chicken = parseFoodYield({
  state: "raw",
  yield_from_g: 150,
  yield_to_g: 110,
});
if (!chicken) {
  throw new Error("chicken yield missing");
}

assertEqual(toCookedGrams(150, chicken), 110, "150 raw -> 110 cooked");
assertEqual(
  toNativeGrams(110, "cooked", chicken),
  150,
  "110 cooked -> 150 raw",
);
assertEqual(toNativeGrams(150, "native", chicken), 150, "native stays native");
assertEqual(convertYieldGrams(70, 70, 210), 210, "70 dry -> 210 cooked");
assertEqual(formatYieldGrams(136.36), "136.4", "one decimal");
assertEqual(formatYieldGrams(150), "150", "integer grams");
assertEqual(
  toNativeGrams(
    switchGramsMode(110, "cooked", "native", chicken),
    "native",
    chicken,
  ),
  150,
  "switch cooked to native",
);
assertEqual(
  parseFoodYield({ state: "cooked", yield_from_g: 150, yield_to_g: 110 }),
  null,
  "cooked has no pair",
);
assertEqual(
  parseFoodYield({ state: "raw", yield_from_g: 150, yield_to_g: null }),
  null,
  "incomplete pair",
);

console.log("food yield ok");
