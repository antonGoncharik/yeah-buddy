"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  factFromDay,
  hiddenMealKcalFromDay,
  hiddenMealTypesFromDay,
  remainingFromDay,
  visibleMealsFromDay,
} from "@/components/day/today-derived";
import { useTodayCopy } from "@/components/day/use-today-copy";
import { useTodayData } from "@/components/day/use-today-data";
import { useTodayDayActions } from "@/components/day/use-today-day-actions";
import { useTodayWorkoutStart } from "@/components/day/use-today-workout-start";
import { useDayMood } from "@/components/layout/day-mood";
import { subscribeActionError } from "@/lib/action-error";
import {
  calendarToday,
  isCatchUpWindowDate,
  isDayWritable,
  nextIsoDate,
  previousIsoDate,
  resolveStartDate,
  todayHistoryDayHref,
  todayHomeHref,
  visibleTodayDate,
  writeStateFromDay,
} from "@/lib/day/dates";
import { gymLoopFromTodayState } from "@/lib/day/loop";
import { isRecord } from "@/lib/read";
import { parseWorkoutSession } from "@/lib/workout/map-rows";

function replaceTodayUrl(href: string): void {
  const current = `${window.location.pathname}${window.location.search}`;
  if (current === href) {
    return;
  }
  window.history.replaceState(null, "", href);
}

export function useTodayScreen({
  initialDate,
  readOnly = false,
  fromSettings = false,
}: {
  initialDate?: string;
  readOnly?: boolean;
  fromSettings?: boolean;
}) {
  const { setMood } = useDayMood();
  const [date, setDate] = useState(() =>
    resolveStartDate(initialDate, calendarToday()),
  );
  const dateRef = useRef(date);
  const routeDateRef = useRef(initialDate);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const clearActionError = useCallback(() => {
    setActionError(null);
  }, []);

  useEffect(() => subscribeActionError(setActionError), []);

  const data = useTodayData(date, clearActionError);
  const isToday = date === data.today;
  const fromHistory = readOnly;
  const { shownDay } = data;
  const writable = isDayWritable(date, data.today, writeStateFromDay(shownDay));
  const catchUp =
    shownDay?.caught_up === true ||
    (writable && isCatchUpWindowDate(date, data.today));
  const viewOnly = fromHistory || !writable;

  const gym = useMemo(
    () =>
      gymLoopFromTodayState(data.workoutState, {
        isToday,
        isTrainingDay: shownDay?.is_training_day === true,
      }),
    [isToday, shownDay?.is_training_day, data.workoutState],
  );

  useEffect(() => {
    const routeChanged = routeDateRef.current !== initialDate;
    routeDateRef.current = initialDate;
    const next = visibleTodayDate({
      current: dateRef.current,
      today: data.today,
      routeDate: initialDate,
      routeChanged,
    });
    dateRef.current = next;
    setDate(next);
  }, [data.today, initialDate]);

  const goToDate = useCallback(
    (next: string) => {
      const resolved = resolveStartDate(next, data.today);
      if (resolved === dateRef.current) {
        return;
      }
      dateRef.current = resolved;
      setDate(resolved);
      const href = fromHistory
        ? todayHistoryDayHref(resolved, fromSettings, data.today)
        : todayHomeHref(resolved, data.today);
      replaceTodayUrl(href);
    },
    [data.today, fromHistory, fromSettings],
  );

  const goBy = useCallback(
    (direction: -1 | 1) => {
      goToDate(
        direction < 0
          ? previousIsoDate(dateRef.current)
          : nextIsoDate(dateRef.current),
      );
    },
    [goToDate],
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
  const recipe = shownDay
    ? shownDay.is_training_day
      ? data.recipes.training
      : data.recipes.rest
    : [];
  const remaining = remainingFromDay(shownDay, recipe);
  const remainingLine = remaining.line;
  const remainingFullGap = remaining.fullGap;
  const remainingMealTypes = remaining.mealTypes;

  const {
    copyYesterday,
    copyMealFromDate,
    applyNamedMeal,
    saveNamedMeal,
    shareMeal,
    shareNamedMeal,
    deleteNamedMeal,
    clearDayFood,
    fillDayFromTemplate,
    fillMealFromTemplate,
  } = useTodayCopy({
    viewOnly,
    date,
    day: data.day,
    setBusy,
    setNamedMeals: data.setNamedMeals,
  });
  const { startQueuedWorkout } = useTodayWorkoutStart({
    viewOnly,
    date,
    shownDay,
    restRecipe: data.recipes.rest,
    setBusy,
    setActionError,
  });
  const { createDay, switchType, saveBodyWeight, saveWaist, deleteItem } =
    useTodayDayActions({
      viewOnly,
      date,
      day: data.day,
    });

  const openedTodayRef = useRef<string | null>(null);
  useEffect(() => {
    if (!data.contentReady || data.loadError || viewOnly || shownDay) {
      return;
    }
    if (date !== data.today) {
      return;
    }
    if (openedTodayRef.current === date) {
      return;
    }
    openedTodayRef.current = date;
    const session = parseWorkoutSession(
      isRecord(data.workoutState) ? data.workoutState.session : null,
    );
    void createDay(session ? "training" : "rest");
  }, [
    createDay,
    data.contentReady,
    data.loadError,
    data.today,
    data.workoutState,
    date,
    shownDay,
    viewOnly,
  ]);

  const dayHasItems = Boolean(
    shownDay?.meals.some((meal) => meal.items.length > 0),
  );

  return {
    date,
    today: data.today,
    isToday,
    writable,
    catchUp,
    viewOnly,
    contentReady: data.contentReady,
    shownDay,
    gym,
    visibleMeals,
    hiddenMealKcal,
    hiddenMealTypes,
    fact,
    remainingLine,
    remainingFullGap,
    remainingMealTypes,
    dayHasItems,
    yesterdayExists: data.yesterdayExists,
    yesterdayHasFood: data.yesterdayHasFood,
    copyDays: data.copyDays,
    namedMeals: data.namedMeals,
    lastBodyWeight: data.lastBodyWeight,
    lastWaist: data.lastWaist,
    weightSteady: data.weightSteady,
    priorProteinHits: data.priorProteinHits,
    reviewReady: data.reviewReady,
    retentionTail: data.retentionTail,
    busy,
    loadError: data.loadError,
    actionError,
    load: data.load,
    goToDate,
    goBy,
    createDay,
    copyYesterday,
    clearDayFood,
    fillDayFromTemplate,
    fillMealFromTemplate,
    copyMealFromDate,
    applyNamedMeal,
    saveNamedMeal,
    shareMeal,
    shareNamedMeal,
    deleteNamedMeal,
    switchType,
    saveBodyWeight,
    saveWaist,
    deleteItem,
    startQueuedWorkout,
  };
}
