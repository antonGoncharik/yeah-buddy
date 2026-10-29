"use client";

import {
  EnergyGoalCard,
  EnergyGoalHintCard,
} from "@/components/day/energy-goal-card";
import { MacroGapHint } from "@/components/day/macro-gap-hint";
import { ProteinCloseOffers } from "@/components/day/protein-close-offers";
import { TodayQuickFoods } from "@/components/day/today-quick-foods";
import type { DayWithMeals } from "@/lib/day/map";
import type { EnergyGoalOffer } from "@/lib/nutrition/energy-goal";
import { MACRO_GAP_PROTEIN_MIN } from "@/lib/nutrition/macro-gap-hint";
import { macroRoomGrams } from "@/lib/nutrition/macro-hit";
import type { MealType } from "@/lib/types";

export function TodayDayViewCloseBlock({
  dayHasItems,
  viewOnly,
  date,
  today,
  shownDay,
  fact,
  quickLogMeals,
  quickLogMealId,
  proteinLogMealId,
  remainingProtein,
  muscleNutritionHint,
  energyGoal,
  energyGoalHint,
  energyGoalBusy,
  onApplyEnergyGoal,
  onDismissEnergyGoal,
  onQuickMealChange,
  busy,
  visibleMeals,
}: {
  dayHasItems: boolean;
  viewOnly: boolean;
  date: string;
  today: string;
  shownDay: DayWithMeals;
  fact: { protein: number; fat: number; carbs: number; kcal: number };
  quickLogMeals: Array<{ id: string; meal_type: MealType }>;
  quickLogMealId: string | null;
  proteinLogMealId: string | null;
  remainingProtein: number;
  muscleNutritionHint: string | null;
  energyGoal: EnergyGoalOffer | null;
  energyGoalHint: string | null;
  energyGoalBusy: boolean;
  onApplyEnergyGoal: () => void;
  onDismissEnergyGoal: (dismissedKcal: number) => void;
  onQuickMealChange: (mealId: string) => void;
  busy: boolean;
  visibleMeals: DayWithMeals["meals"];
}) {
  if (!dayHasItems || viewOnly) {
    return null;
  }

  const proteinCloseBlock =
    remainingProtein > MACRO_GAP_PROTEIN_MIN ? (
      <MacroGapHint
        date={date}
        meals={quickLogMeals}
        mealId={proteinLogMealId}
        onMealId={onQuickMealChange}
        remainingProtein={remainingProtein}
        remainingFat={macroRoomGrams(fact.fat, shownDay.target_fat)}
        remainingCarbs={macroRoomGrams(fact.carbs, shownDay.target_carbs)}
        remainingKcal={shownDay.target_kcal - fact.kcal}
        busy={busy}
      />
    ) : (
      <ProteinCloseOffers
        date={date}
        meals={quickLogMeals}
        mealId={proteinLogMealId}
        onMealId={onQuickMealChange}
        remainingProtein={remainingProtein}
        remainingFat={macroRoomGrams(fact.fat, shownDay.target_fat)}
        remainingCarbs={macroRoomGrams(fact.carbs, shownDay.target_carbs)}
        remainingKcal={shownDay.target_kcal - fact.kcal}
        busy={busy}
      />
    );

  return (
    <>
      {date === today && energyGoal ? (
        <EnergyGoalCard
          offer={energyGoal}
          busy={energyGoalBusy}
          onApply={onApplyEnergyGoal}
          onDismiss={() => onDismissEnergyGoal(energyGoal.restKcal)}
        />
      ) : null}
      {date === today && !energyGoal && energyGoalHint ? (
        <EnergyGoalHintCard line={energyGoalHint} />
      ) : null}
      {muscleNutritionHint ? (
        <p className="text-sm text-muted-foreground">{muscleNutritionHint}</p>
      ) : null}
      {quickLogMealId ? (
        <TodayQuickFoods
          date={date}
          meals={visibleMeals.map((meal) => ({
            id: meal.id,
            meal_type: meal.meal_type,
          }))}
          mealId={quickLogMealId}
          onMealId={onQuickMealChange}
          busy={busy}
        />
      ) : null}
      {proteinCloseBlock}
    </>
  );
}
