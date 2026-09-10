import type {
  MealsPackPayload,
  SharePackKind,
  WorkoutsPackPayload,
} from "@/lib/share/payload";
import type { DayType, MealType, WorkoutKind } from "@/lib/types";

export interface SharePackSummary {
  id: string;
  token: string;
  kind: SharePackKind;
  title: string;
  hint: string;
  created_at: string;
  revoked: boolean;
  mine: boolean;
  share_url: string | null;
}

export interface ShareMealDayPreview {
  day_type: DayType;
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
  meals: Array<{
    meal_type: MealType;
    items: Array<{ name: string; grams: number }>;
  }>;
}

export interface ShareWorkoutDayPreview {
  name: string;
  kind: WorkoutKind;
  exercises: string[];
}

export interface SharePackDetail extends SharePackSummary {
  owner_name: string | null;
  saved: boolean;
  meals: {
    goals: MealsPackPayload["goals"];
    days: ShareMealDayPreview[];
  } | null;
  workouts: {
    formula_hint: string;
    days: ShareWorkoutDayPreview[];
  } | null;
}

export type { WorkoutsPackPayload };
