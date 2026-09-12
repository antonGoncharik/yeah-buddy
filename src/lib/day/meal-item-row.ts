import {
  calcMacrosFromPer100,
  type Macros,
  roundMacros,
} from "@/lib/nutrition";

export function buildMealItemRow({
  userId,
  mealId,
  foodId,
  name,
  grams,
  per100,
}: {
  userId: string;
  mealId: string;
  foodId: string | null;
  name: string;
  grams: number;
  per100: Macros;
}) {
  const macros = roundMacros(calcMacrosFromPer100(per100, grams));

  return {
    user_id: userId,
    meal_id: mealId,
    food_id: foodId,
    name_snapshot: name,
    grams,
    protein: macros.protein,
    fat: macros.fat,
    carbs: macros.carbs,
    kcal: macros.kcal,
    per_100_snapshot: per100,
  };
}
