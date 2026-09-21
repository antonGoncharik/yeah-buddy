import { shareSplit } from "@/lib/day/food-shares";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

const split = shareSplit([
  {
    training: false,
    items: [
      { name: "Творог", protein: 30, kcal: 180, grams: 200 },
      { name: "  ", protein: 1, kcal: 1, grams: 1 },
    ],
  },
  {
    training: true,
    items: [
      { name: "Курица", protein: 40, kcal: 220, grams: 180 },
      { name: "Рис", protein: 6, kcal: 260, grams: 200 },
    ],
  },
]);

assertEqual(split.all[0]?.name, "Курица", "all ranks by protein");
assertEqual(split.all.length, 3, "blank names drop");
assertEqual(split.rest[0]?.name, "Творог", "rest plate");
assertEqual(split.rest.length, 1, "rest stays rest");
assertEqual(split.training[0]?.name, "Курица", "training plate");
assertEqual(split.training.length, 2, "training stays training");
assertEqual(split.training[1]?.kcal, 260, "kcal rounds");

console.log("food shares ok");
