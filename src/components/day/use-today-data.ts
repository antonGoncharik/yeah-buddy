"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cachedGet, peekJson } from "@/lib/api-cache";
import { calendarToday, isIsoDate } from "@/lib/day/dates";
import type { DayWithMeals } from "@/lib/day/map";
import type { RecipeLine } from "@/lib/day/remaining";
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

export function resolveStartDate(
  value: string | undefined,
  today: string,
): string {
  if (value && isIsoDate(value) && value <= today) {
    return value;
  }
  return today;
}

export function useTodayData(date: string, onLoadStart?: () => void) {
  const [serverToday, setServerToday] = useState<string | null>(null);
  const today = serverToday ?? calendarToday();
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
  const [loadedDate, setLoadedDate] = useState<string | null>(null);
  const dateRef = useRef(date);
  dateRef.current = date;

  const contentReady = loadedDate === date;
  const shownDay = contentReady && day?.date === date ? day : null;

  const load = useCallback(async () => {
    const requestedDate = date;
    setLoadError(false);
    onLoadStart?.();
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
  }, [begin, date, done, onLoadStart]);

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

  return {
    today,
    day,
    setDay,
    yesterdayExists,
    copyDays,
    namedMeals,
    setNamedMeals,
    recipes,
    lastBodyWeight,
    workoutState,
    loadError,
    contentReady,
    shownDay,
    load,
  };
}
