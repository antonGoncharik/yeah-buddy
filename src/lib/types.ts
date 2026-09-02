export type FoodState = "raw" | "dry" | "cooked" | "as_is" | "liquid";

export type MealType =
  | "breakfast"
  | "lunch"
  | "snack"
  | "dinner"
  | "pre_workout"
  | "post_workout";

export type DayType = "rest" | "training";

export interface User {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  language_code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  user_id: string;
  rest_protein: number;
  rest_fat: number;
  rest_carbs: number;
  training_protein: number;
  training_fat: number;
  training_carbs: number;
  updated_at: string;
}

export interface Food {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  state: FoodState;
  protein_per_100: number;
  fat_per_100: number;
  carbs_per_100: number;
  kcal_per_100: number;
  default_portion_g: number | null;
  default_portion_label: string | null;
  is_favorite: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Day {
  id: string;
  user_id: string;
  date: string;
  is_training_day: boolean;
  target_protein: number;
  target_fat: number;
  target_carbs: number;
  target_kcal: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  day_id: string;
  meal_type: MealType;
  sort_order: number;
  created_at: string;
}

export interface MealItem {
  id: string;
  user_id: string;
  meal_id: string;
  food_id: string | null;
  name_snapshot: string;
  grams: number;
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
  per_100_snapshot: {
    protein: number;
    fat: number;
    carbs: number;
    kcal: number;
  };
  created_at: string;
  updated_at: string;
}

export interface MealTemplate {
  id: string;
  user_id: string;
  name: string;
  day_type: DayType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MealTemplateItem {
  id: string;
  user_id: string;
  template_id: string;
  meal_type: MealType;
  food_id: string;
  grams: number;
  sort_order: number;
  created_at: string;
}
