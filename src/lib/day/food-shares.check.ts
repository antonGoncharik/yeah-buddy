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
      {
        meal: "dinner",
        name: "Творог",
        protein: 30,
        fat: 10,
        carbs: 6,
        kcal: 180,
        grams: 200,
      },
      {
        meal: "dinner",
        name: "  ",
        protein: 1,
        fat: 0,
        carbs: 0,
        kcal: 1,
        grams: 1,
      },
    ],
  },
  {
    training: true,
    items: [
      {
        meal: "lunch",
        name: "Курица",
        protein: 40,
        fat: 4,
        carbs: 0,
        kcal: 220,
        grams: 180,
      },
      {
        meal: "lunch",
        name: "Рис",
        protein: 6,
        fat: 1,
        carbs: 54,
        kcal: 260,
        grams: 200,
      },
      {
        meal: "post_workout",
        name: "Банан",
        protein: 1,
        fat: 0,
        carbs: 20,
        kcal: 90,
        grams: 100,
      },
    ],
  },
  {
    training: true,
    items: [
      {
        meal: "post_workout",
        name: "Банан",
        protein: 1,
        fat: 0,
        carbs: 20,
        kcal: 90,
        grams: 100,
      },
    ],
  },
]);

assertEqual(split.all[0]?.name, "Курица", "all ranks by protein");
assertEqual(split.all.length, 4, "blank names drop");
assertEqual(
  split.all.find((food) => food.name === "Рис")?.carbs,
  54,
  "carbs stay",
);
assertEqual(split.all.find((food) => food.name === "Рис")?.fat, 1, "fat stays");
assertEqual(split.rest[0]?.name, "Творог", "rest plate");
assertEqual(split.rest.length, 1, "rest stays rest");
assertEqual(split.training[0]?.name, "Курица", "training plate");
assertEqual(split.training.length, 3, "training stays training");
assertEqual(split.training[1]?.kcal, 260, "kcal rounds");
assertEqual(split.mealsRest[0]?.meal, "dinner", "rest meal");
assertEqual(split.mealsRest[0]?.protein, 31, "blank name still feeds the meal");
assertEqual(
  split.mealsTraining.find((meal) => meal.meal === "post_workout")?.carbs,
  20,
  "post-workout carbs average across training days",
);

console.log("food shares ok");
