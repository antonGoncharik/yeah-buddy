import type { MealType } from "@/lib/types";

export interface RecipeLine {
  foodId: string;
  name: string;
  grams: number;
  mealType: MealType;
}

export interface RemainingLine {
  name: string;
  grams: number;
}

export interface RemainingFill {
  mealType: MealType;
  foodId: string;
  name: string;
  grams: number;
}

export interface LoggedRecipeItem {
  food_id: string | null;
  name_snapshot: string;
  grams: number;
}

export interface RemainingMeal {
  meal_type: MealType;
  items: LoggedRecipeItem[];
}

export interface PlannedLine {
  mealType: MealType;
  foodId: string;
  name: string;
  grams: number;
}
