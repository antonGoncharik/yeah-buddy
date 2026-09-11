export type FoodState = "raw" | "dry" | "cooked" | "as_is" | "liquid";

export type MealType =
  | "breakfast"
  | "lunch"
  | "snack"
  | "dinner"
  | "pre_workout"
  | "post_workout";

export type DayType = "rest" | "training";

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
  body_weight: number | null;
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

export interface MealTemplateItemView extends MealTemplateItem {
  food: Food;
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
}

export interface MealTemplateDetail extends MealTemplate {
  items: MealTemplateItemView[];
}

export interface NamedMeal {
  id: string;
  user_id: string;
  name: string;
  meal_type: MealType;
  created_at: string;
  updated_at: string;
}

export interface NamedMealItem {
  id: string;
  user_id: string;
  named_meal_id: string;
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
  sort_order: number;
  created_at: string;
}

export interface NamedMealDetail extends NamedMeal {
  items: NamedMealItem[];
}

export interface NamedMealHint {
  id: string;
  name: string;
  meal_type: MealType;
}

export interface CopyDayHint {
  date: string;
  mealTypes: MealType[];
}

export interface DayHistoryRow {
  date: string;
  is_training_day: boolean;
  target_protein: number;
  target_fat: number;
  target_carbs: number;
  target_kcal: number;
  body_weight: number | null;
  fact_protein: number;
  fact_fat: number;
  fact_carbs: number;
  fact_kcal: number;
}
