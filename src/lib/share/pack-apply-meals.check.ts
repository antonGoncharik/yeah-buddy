import { foodsForMealsPayload } from "@/lib/share/pack-apply-meals";
import type { MealsPackPayload } from "@/lib/share/payload";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const payload = {
  v: 1,
  goals: {
    rest_protein: 150,
    rest_fat: 60,
    rest_carbs: 150,
    training_protein: 160,
    training_fat: 60,
    training_carbs: 200,
  },
  foods: [],
  templates: [
    {
      day_type: "rest",
      items: [
        {
          meal_type: "breakfast",
          food_name: "Овсянка",
          food_state: "as_is",
          protein_per_100: 10,
          fat_per_100: 5,
          carbs_per_100: 60,
          grams: 100,
        },
      ],
    },
    { day_type: "training", items: [] },
  ],
} as MealsPackPayload;

const merged = foodsForMealsPayload(payload);
assert(merged.length === 1, "item-only payload still yields food");
assert(merged[0]?.name === "Овсянка", "synthesized food name");
