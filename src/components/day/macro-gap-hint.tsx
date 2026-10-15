"use client";

import { ProteinCloseOffers } from "@/components/day/protein-close-offers";
import type { MealType } from "@/lib/types";

/** FEAT-03: evening-style protein gap suggestions (≥25 g) from favorites and recent foods. */
export function MacroGapHint(props: {
  date: string;
  meals?: ReadonlyArray<{ id: string; meal_type: MealType }>;
  mealId: string | null;
  onMealId?: (mealId: string) => void;
  remainingProtein: number;
  remainingFat: number;
  remainingCarbs: number;
  remainingKcal: number;
  busy: boolean;
}) {
  return <ProteinCloseOffers {...props} macroGap />;
}
