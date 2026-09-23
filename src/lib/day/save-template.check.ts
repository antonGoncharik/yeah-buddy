import type { DayWithMeals } from "@/lib/day/map";
import { templateItemsFromDay } from "@/lib/day/save-template";

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
  }
}

const day = {
  id: "d1",
  user_id: "u1",
  date: "2026-09-20",
  is_training_day: false,
  target_protein: 140,
  target_fat: 60,
  target_carbs: 200,
  body_weight: null,
  waist_cm: null,
  caught_up: false,
  created_at: "",
  meals: [
    {
      id: "m1",
      user_id: "u1",
      day_id: "d1",
      meal_type: "breakfast",
      sort_order: 10,
      items: [
        {
          id: "i1",
          user_id: "u1",
          meal_id: "m1",
          food_id: "f1",
          name_snapshot: "Овсянка",
          grams: 80,
          protein: 10,
          fat: 5,
          carbs: 50,
          kcal: 280,
          per_100_snapshot: { protein: 12, fat: 6, carbs: 62, kcal: 350 },
        },
        {
          id: "i2",
          user_id: "u1",
          meal_id: "m1",
          food_id: null,
          name_snapshot: "Разовое",
          grams: 100,
          protein: 5,
          fat: 5,
          carbs: 5,
          kcal: 85,
          per_100_snapshot: { protein: 5, fat: 5, carbs: 5, kcal: 85 },
        },
      ],
    },
    {
      id: "m2",
      user_id: "u1",
      day_id: "d1",
      meal_type: "pre_workout",
      sort_order: 40,
      items: [
        {
          id: "i3",
          user_id: "u1",
          meal_id: "m2",
          food_id: "f2",
          name_snapshot: "Банан",
          grams: 120,
          protein: 1,
          fat: 0,
          carbs: 27,
          kcal: 110,
          per_100_snapshot: { protein: 1, fat: 0, carbs: 23, kcal: 90 },
        },
      ],
    },
  ],
} as DayWithMeals;

assertEqual(
  templateItemsFromDay(day, "rest"),
  [{ mealType: "breakfast", foodId: "f1", grams: 80 }],
  "rest keeps catalog foods and drops hidden pre-workout plus one-off",
);

assertEqual(
  templateItemsFromDay({ ...day, is_training_day: true }, "training"),
  [
    { mealType: "breakfast", foodId: "f1", grams: 80 },
    { mealType: "pre_workout", foodId: "f2", grams: 120 },
  ],
  "training keeps visible pre-workout",
);

assertEqual(
  templateItemsFromDay(
    {
      ...day,
      meals: day.meals.map((meal) => ({
        ...meal,
        items: meal.items.filter((item) => item.food_id == null),
      })),
    },
    "rest",
  ),
  [],
  "only one-offs leave the template empty",
);

console.log("save day template ok");
