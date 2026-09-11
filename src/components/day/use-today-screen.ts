"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  factFromDay,
  hiddenMealKcalFromDay,
  hiddenMealTypesFromDay,
  visibleMealsFromDay,
} from "@/components/day/today-derived";
import { bannerFromTodayState } from "@/components/day/today-workout-banner";
import { useTodayCopy } from "@/components/day/use-today-copy";
import {
  resolveStartDate,
  useTodayData,
} from "@/components/day/use-today-data";
import { useTodayDayActions } from "@/components/day/use-today-day-actions";
import { useTodayWorkoutStart } from "@/components/day/use-today-workout-start";
import { useDayMood } from "@/components/layout/day-mood";
import {
  calendarToday,
  isWritableDayDate,
  todayHistoryDayHref,
  todayHomeHref,
} from "@/lib/day/dates";
import {
  formatRemainingLine,
  loggedItemsFromMeals,
  remainingRecipe,
} from "@/lib/day/remaining";

export function useTodayScreen({
  initialDate,
  readOnly = false,
  fromSettings = false,
}: {
  initialDate?: string;
  readOnly?: boolean;
  fromSettings?: boolean;
}) {
  const router = useRouter();
  const { setMood } = useDayMood();
  const [date, setDate] = useState(() =>
    resolveStartDate(initialDate, calendarToday()),
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const clearActionError = useCallback(() => {
    setActionError(null);
  }, []);

  const data = useTodayData(date, clearActionError);
  const isToday = date === data.today;
  const fromHistory = readOnly;
  const writable = isWritableDayDate(date, data.today);
  const viewOnly = fromHistory || !writable;
  const { shownDay } = data;

  const banner = useMemo(
    () =>
      bannerFromTodayState(data.workoutState, {
        isToday,
        isTrainingDay: shownDay?.is_training_day === true,
      }),
    [isToday, shownDay?.is_training_day, data.workoutState],
  );

  useEffect(() => {
    setDate(resolveStartDate(initialDate, calendarToday()));
  }, [initialDate]);

  const goToDate = useCallback(
    (next: string) => {
      const resolved = resolveStartDate(next, data.today);
      setDate(resolved);
      const href = fromHistory
        ? todayHistoryDayHref(resolved, fromSettings)
        : todayHomeHref(resolved);
      router.replace(href, { scroll: false });
    },
    [data.today, fromHistory, fromSettings, router],
  );

  useEffect(() => {
    if (!data.contentReady || !shownDay) {
      setMood(null);
      return;
    }

    setMood(shownDay.is_training_day ? "training" : "rest");
  }, [data.contentReady, shownDay, setMood]);

  const visibleMeals = useMemo(() => visibleMealsFromDay(shownDay), [shownDay]);
  const fact = useMemo(() => factFromDay(shownDay), [shownDay]);
  const hiddenMealKcal = useMemo(
    () => hiddenMealKcalFromDay(shownDay),
    [shownDay],
  );
  const hiddenMealTypes = useMemo(
    () => hiddenMealTypesFromDay(shownDay),
    [shownDay],
  );
  const remainingLine = useMemo(() => {
    if (!shownDay) {
      return null;
    }
    const recipe = shownDay.is_training_day
      ? data.recipes.training
      : data.recipes.rest;
    return formatRemainingLine(
      remainingRecipe(
        recipe,
        loggedItemsFromMeals(shownDay.meals),
        shownDay.is_training_day,
      ),
    );
  }, [data.recipes, shownDay]);

  const {
    copyYesterday,
    copyMealFromDate,
    applyNamedMeal,
    saveNamedMeal,
    deleteNamedMeal,
  } = useTodayCopy({
    viewOnly,
    date,
    day: data.day,
    setBusy,
    setActionError,
    setDay: data.setDay,
    setNamedMeals: data.setNamedMeals,
  });
  const { startQueuedWorkout } = useTodayWorkoutStart({
    viewOnly,
    date,
    shownDay,
    setBusy,
    setActionError,
    load: data.load,
  });
  const { createDay, switchType, saveBodyWeight, deleteItem } =
    useTodayDayActions({
      viewOnly,
      date,
      day: data.day,
      setBusy,
      setActionError,
      setDay: data.setDay,
    });

  const dayHasItems = Boolean(
    shownDay?.meals.some((meal) => meal.items.length > 0),
  );

  return {
    date,
    today: data.today,
    isToday,
    writable,
    viewOnly,
    contentReady: data.contentReady,
    shownDay,
    banner,
    visibleMeals,
    hiddenMealKcal,
    hiddenMealTypes,
    fact,
    remainingLine,
    dayHasItems,
    yesterdayExists: data.yesterdayExists,
    copyDays: data.copyDays,
    namedMeals: data.namedMeals,
    lastBodyWeight: data.lastBodyWeight,
    busy,
    loadError: data.loadError,
    actionError,
    load: data.load,
    goToDate,
    createDay,
    copyYesterday,
    copyMealFromDate,
    applyNamedMeal,
    saveNamedMeal,
    deleteNamedMeal,
    switchType,
    saveBodyWeight,
    deleteItem,
    startQueuedWorkout,
  };
}
