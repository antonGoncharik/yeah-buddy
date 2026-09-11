"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  factFromDay,
  hiddenMealKcalFromDay,
  hiddenMealTypesFromDay,
  visibleMealsFromDay,
} from "@/components/day/today-derived";
import { bannerFromTodayState } from "@/components/day/today-workout-banner";
import { useTodayCopy } from "@/components/day/use-today-copy";
import { useTodayDayActions } from "@/components/day/use-today-day-actions";
import { useTodayWorkoutStart } from "@/components/day/use-today-workout-start";
import { useDayMood } from "@/components/layout/day-mood";
import { cachedGet, peekJson } from "@/lib/api-cache";
import {
  calendarToday,
  isIsoDate,
  isWritableDayDate,
  todayHistoryDayHref,
  todayHomeHref,
} from "@/lib/day/dates";
import type { DayWithMeals } from "@/lib/day/map";
import {
  formatRemainingLine,
  loggedItemsFromMeals,
  type RecipeLine,
  remainingRecipe,
} from "@/lib/day/remaining";
import {
  readCalendarToday,
  readCopyDays,
  readDay,
  readLastBodyWeight,
  readNamedMeals,
  readRecipes,
  readYesterdayExists,
} from "@/lib/day/today-payload";
import type { CopyDayHint, NamedMealHint } from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";

function resolveStartDate(value: string | undefined, today: string): string {
  if (value && isIsoDate(value) && value <= today) {
    return value;
  }
  return today;
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
  const [serverToday, setServerToday] = useState<string | null>(null);
  const today = serverToday ?? calendarToday();
  const router = useRouter();
  const [date, setDate] = useState(() =>
    resolveStartDate(initialDate, calendarToday()),
  );
  const { setMood } = useDayMood();
  const [day, setDay] = useState<DayWithMeals | null>(null);
  const [yesterdayExists, setYesterdayExists] = useState(false);
  const [copyDays, setCopyDays] = useState<CopyDayHint[]>([]);
  const [namedMeals, setNamedMeals] = useState<NamedMealHint[]>([]);
  const [recipes, setRecipes] = useState<{
    rest: RecipeLine[];
    training: RecipeLine[];
  }>({ rest: [], training: [] });
  const [lastBodyWeight, setLastBodyWeight] = useState<number | null>(null);
  const [workoutState, setWorkoutState] = useState<unknown>(null);
  const { begin, done, reset } = useFirstLoad();
  const [loadError, setLoadError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadedDate, setLoadedDate] = useState<string | null>(null);
  const dateRef = useRef(date);
  dateRef.current = date;

  const isToday = date === today;
  const fromHistory = readOnly;
  const writable = isWritableDayDate(date, today);
  const viewOnly = fromHistory || !writable;
  const contentReady = loadedDate === date;
  const shownDay = contentReady && day?.date === date ? day : null;

  const banner = useMemo(
    () =>
      bannerFromTodayState(workoutState, {
        isToday,
        isTrainingDay: shownDay?.is_training_day === true,
      }),
    [isToday, shownDay?.is_training_day, workoutState],
  );

  const load = useCallback(async () => {
    const requestedDate = date;
    setLoadError(false);
    setActionError(null);
    const dayUrl = `/api/days?date=${encodeURIComponent(requestedDate)}`;
    const sessionUrl = `/api/sessions?date=${encodeURIComponent(requestedDate)}`;
    const stillCurrent = () => dateRef.current === requestedDate;
    const showCached = () => {
      if (stillCurrent()) {
        done(true);
      }
    };
    if (peekJson(dayUrl) != null || peekJson(sessionUrl) != null) {
      showCached();
    } else {
      begin();
    }

    const results = await Promise.all([
      cachedGet(
        dayUrl,
        (data) => {
          if (!stillCurrent()) {
            return true;
          }
          const nextToday = readCalendarToday(data);
          if (nextToday) {
            setServerToday(nextToday);
          }
          setDay(readDay(data));
          setYesterdayExists(readYesterdayExists(data));
          setCopyDays(readCopyDays(data));
          setNamedMeals(readNamedMeals(data));
          setRecipes(readRecipes(data));
          setLastBodyWeight(readLastBodyWeight(data));
          setLoadedDate(requestedDate);
          return true;
        },
        showCached,
      ).then(
        () => true,
        () => false,
      ),
      cachedGet(
        sessionUrl,
        (data) => {
          if (!stillCurrent()) {
            return true;
          }
          setWorkoutState(data);
          return true;
        },
        showCached,
      ).then(
        () => true,
        () => false,
      ),
    ]);

    if (!stillCurrent()) {
      return;
    }

    if (!results.some((ok) => ok)) {
      setLoadError(true);
      setLoadedDate(requestedDate);
      done(false);
      return;
    }

    setLoadedDate(requestedDate);
    done(true);
  }, [begin, date, done]);

  useEffect(() => {
    setDate(resolveStartDate(initialDate, calendarToday()));
  }, [initialDate]);

  const goToDate = useCallback(
    (next: string) => {
      const resolved = resolveStartDate(next, today);
      setDate(resolved);
      const href = fromHistory
        ? todayHistoryDayHref(resolved, fromSettings)
        : todayHomeHref(resolved);
      router.replace(href, { scroll: false });
    },
    [fromHistory, fromSettings, router, today],
  );

  useEffect(() => {
    setDay(null);
    setYesterdayExists(false);
    setCopyDays([]);
    setLastBodyWeight(null);
    setWorkoutState(null);
    if (date.length > 0) {
      reset();
    }
  }, [date, reset]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!contentReady || !shownDay) {
      setMood(null);
      return;
    }

    setMood(shownDay.is_training_day ? "training" : "rest");
  }, [contentReady, shownDay, setMood]);

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
    const recipe = shownDay.is_training_day ? recipes.training : recipes.rest;
    return formatRemainingLine(
      remainingRecipe(
        recipe,
        loggedItemsFromMeals(shownDay.meals),
        shownDay.is_training_day,
      ),
    );
  }, [recipes, shownDay]);

  const {
    copyYesterday,
    copyMealFromDate,
    applyNamedMeal,
    saveNamedMeal,
    deleteNamedMeal,
  } = useTodayCopy({
    viewOnly,
    date,
    day,
    setBusy,
    setActionError,
    setDay,
    setNamedMeals,
  });
  const { startQueuedWorkout } = useTodayWorkoutStart({
    viewOnly,
    date,
    shownDay,
    setBusy,
    setActionError,
    load,
  });
  const { createDay, switchType, saveBodyWeight, deleteItem } =
    useTodayDayActions({
      viewOnly,
      date,
      day,
      setBusy,
      setActionError,
      setDay,
    });

  const dayHasItems = Boolean(
    shownDay?.meals.some((meal) => meal.items.length > 0),
  );

  return {
    date,
    today,
    isToday,
    writable,
    viewOnly,
    contentReady,
    shownDay,
    banner,
    visibleMeals,
    hiddenMealKcal,
    hiddenMealTypes,
    fact,
    remainingLine,
    dayHasItems,
    yesterdayExists,
    copyDays,
    namedMeals,
    lastBodyWeight,
    busy,
    loadError,
    actionError,
    load,
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
