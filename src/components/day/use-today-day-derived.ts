"use client";

import { useMemo, useState } from "react";

import { useTodayMuscleNutritionHint } from "@/components/day/use-today-muscle-nutrition-hint";
import { showYesterdayCatchUpHint } from "@/components/day/yesterday-catch-up-hint";
import { withDateQuery } from "@/lib/day/dates";
import type { DayWithMeals } from "@/lib/day/map";
import { isTempId } from "@/lib/day/optimistic";
import { pickQuickLogMealId } from "@/lib/day/quick-log-meal";
import type { MacroGoals } from "@/lib/day/today-payload";
import {
  proteinClosed,
  trainingDayGapLine,
  waistGapLine,
  weightGapLine,
} from "@/lib/flavor";
import { hiddenMealSlotsNote, sumMealItems } from "@/lib/nutrition";
import { macroShortfallGrams } from "@/lib/nutrition/macro-hit";
import { emptyStartCopy } from "@/lib/retention";
import {
  buildEarlyHabitSnapshot,
  type EarlyHabitSnapshot,
  FOOD_STREAK_SUMMARY_DAYS,
  foodStreakLabel,
  inEarlyHabitWindow,
} from "@/lib/retention/habit";
import type { HabitBridgeSnapshot } from "@/lib/retention/habit-bridge";
import type { MealType } from "@/lib/types";

export function useTodayDayDerived({
  date,
  today,
  viewOnly,
  shownDay,
  visibleMeals,
  hiddenMealKcal,
  hiddenMealTypes,
  fact,
  dayHasItems,
  yesterdayExists,
  yesterdayHasFood,
  retentionTail,
  earlyHabit,
  earlyHabitSnapshot,
  priorFoodLogDays,
  habitBridge,
  habitBridgeSnapshot,
  accountAgeDays,
  goals,
  lastBodyWeightDate,
  lastWaistDate,
  priorProteinHits,
  gymEnabled,
  effectiveTraining,
  busy,
  aiText,
}: {
  date: string;
  today: string;
  viewOnly: boolean;
  shownDay: DayWithMeals;
  visibleMeals: DayWithMeals["meals"];
  hiddenMealKcal: number;
  hiddenMealTypes: MealType[];
  fact: { protein: number; fat: number; carbs: number; kcal: number };
  dayHasItems: boolean;
  yesterdayExists: boolean;
  yesterdayHasFood: boolean;
  retentionTail: boolean;
  earlyHabit: boolean;
  earlyHabitSnapshot: EarlyHabitSnapshot | null;
  priorFoodLogDays: number;
  habitBridge: boolean;
  habitBridgeSnapshot: HabitBridgeSnapshot | null;
  accountAgeDays: number | null;
  goals: MacroGoals;
  lastBodyWeightDate: string | null;
  lastWaistDate: string | null;
  priorProteinHits: number;
  gymEnabled: boolean;
  effectiveTraining: boolean;
  busy: boolean;
  aiText: boolean;
}) {
  const [quickMealChoice, setQuickMealChoice] = useState<string | null>(null);

  const hiddenNote = hiddenMealSlotsNote(
    hiddenMealKcal,
    hiddenMealTypes,
    effectiveTraining,
  );
  const remainingProtein = macroShortfallGrams(
    fact.protein,
    shownDay.target_protein,
  );
  const muscleNutritionHint = useTodayMuscleNutritionHint({
    enabled:
      gymEnabled &&
      effectiveTraining &&
      date === today &&
      dayHasItems &&
      shownDay.is_training_day &&
      !viewOnly,
    remainingProtein,
  });
  const yesterdayCatchUp = showYesterdayCatchUpHint({
    isToday: date === today,
    yesterdayExists,
    viewOnly,
    retentionTail,
  });
  const closeMeal = [...visibleMeals]
    .reverse()
    .find((meal) => !isTempId(meal.id));
  const firstMeal = visibleMeals.find((meal) => !isTempId(meal.id));
  const addPath = firstMeal ? `/today/meals/${firstMeal.id}/add` : null;
  const addHref = addPath ? withDateQuery(addPath, date, today) : null;
  const suggestedQuickMealId = pickQuickLogMealId(visibleMeals);
  const quickLogMealId = visibleMeals.some(
    (meal) => meal.id === quickMealChoice,
  )
    ? quickMealChoice
    : suggestedQuickMealId;
  const quickLogMeals = visibleMeals
    .filter((meal) => !isTempId(meal.id))
    .map((meal) => ({ id: meal.id, meal_type: meal.meal_type }));
  const proteinLogMealId =
    quickLogMealId ?? closeMeal?.id ?? quickLogMeals[0]?.id ?? null;
  const showEmptyStart = !viewOnly && !dayHasItems;
  const emptyTextMeal =
    showEmptyStart &&
    aiText &&
    date === today &&
    accountAgeDays != null &&
    accountAgeDays < 3 &&
    quickLogMealId
      ? { date, mealId: quickLogMealId, busy }
      : null;
  const showSaveTemplate = !viewOnly && dayHasItems && !isTempId(shownDay.id);
  const proteinMealCount = shownDay.meals.filter(
    (meal) => sumMealItems(meal.items).protein > 0,
  ).length;
  const trainingGap = gymEnabled
    ? trainingDayGapLine({
        training: effectiveTraining,
        fact,
        rest: { protein: goals.restProtein, carbs: goals.restCarbs },
        day: { protein: shownDay.target_protein, carbs: shownDay.target_carbs },
      })
    : null;
  const weightGap = weightGapLine({
    weight: shownDay.body_weight,
    lastWeightDate: lastBodyWeightDate,
    accountAgeDays,
    date,
    canLog: !viewOnly,
  });
  const waistGap = waistGapLine({
    waist: shownDay.waist_cm,
    lastWaistDate,
    accountAgeDays,
    date,
    canLog: !viewOnly,
  });
  const startCopy = emptyStartCopy({
    earlyHabit,
    isToday: date === today,
    viewOnly,
    dayHasItems,
    yesterdayHasFood,
  });
  const habitSnapshot = useMemo(() => {
    if (accountAgeDays == null) {
      return null;
    }
    const needsSnapshot =
      inEarlyHabitWindow(accountAgeDays) ||
      (dayHasItems && accountAgeDays < FOOD_STREAK_SUMMARY_DAYS);
    if (!needsSnapshot) {
      return null;
    }
    const todayProteinClosed = proteinClosed(
      shownDay.target_protein - fact.protein,
      fact.protein,
    );
    return buildEarlyHabitSnapshot({
      accountAgeDays,
      todayHasFood: dayHasItems,
      priorFoodLogDays,
      todayProteinClosed,
      priorProteinHits,
      gymSessionsWeek: earlyHabitSnapshot?.gymSessionsWeek ?? 0,
    });
  }, [
    accountAgeDays,
    dayHasItems,
    earlyHabitSnapshot?.gymSessionsWeek,
    fact.protein,
    priorFoodLogDays,
    priorProteinHits,
    shownDay.target_protein,
  ]);
  const showWeekShare = !viewOnly && date === today;
  const topNudge = yesterdayCatchUp
    ? ("catch-up" as const)
    : habitSnapshot
      ? ("early-habit" as const)
      : habitBridge && habitBridgeSnapshot
        ? ("habit-bridge" as const)
        : null;
  const foodStreakLine =
    dayHasItems &&
    accountAgeDays != null &&
    accountAgeDays < FOOD_STREAK_SUMMARY_DAYS &&
    habitSnapshot &&
    habitSnapshot.foodLogStreak > 0
      ? foodStreakLabel(habitSnapshot.foodLogStreak, false)
      : null;

  return {
    quickMealChoice,
    setQuickMealChoice,
    hiddenNote,
    remainingProtein,
    muscleNutritionHint,
    addHref,
    quickLogMealId,
    quickLogMeals,
    proteinLogMealId,
    showEmptyStart,
    emptyTextMeal,
    showSaveTemplate,
    proteinMealCount,
    trainingGap,
    weightGap,
    waistGap,
    startCopy,
    habitSnapshot,
    showWeekShare,
    topNudge,
    foodStreakLine,
  };
}
