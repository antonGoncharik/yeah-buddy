"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { cachedGet, peekJson } from "@/lib/api-cache";
import { daysUrl, subscribeDayCache } from "@/lib/day/cache";
import { calendarToday } from "@/lib/day/dates";
import type { DayWithMeals } from "@/lib/day/map";
import type { RecipeLine } from "@/lib/day/remaining";
import {
  readCalendarToday,
  readCopyDays,
  readDay,
  readLastBodyWeight,
  readNamedMeals,
  readRecipes,
  readWeightSteady,
  readYesterdayExists,
} from "@/lib/day/today-payload";
import type { CopyDayHint, NamedMealHint } from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import { prefetchGymCache } from "@/lib/workout/session-local";

function sessionsUrl(date: string): string {
  return `/api/sessions?date=${encodeURIComponent(date)}`;
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
  const [weightSteady, setWeightSteady] = useState(false);
  const [workoutState, setWorkoutState] = useState<unknown>(null);
  const { begin, done, reset } = useFirstLoad();
  const [loadError, setLoadError] = useState(false);
  const [loadedDate, setLoadedDate] = useState<string | null>(null);
  const dateRef = useRef(date);
  dateRef.current = date;

  const applyDayPayload = useCallback(
    (requestedDate: string, data: unknown) => {
      if (dateRef.current !== requestedDate) {
        return true;
      }
      const nextToday = readCalendarToday(data);
      if (nextToday) {
        setServerToday((current) =>
          current == null || nextToday >= current ? nextToday : current,
        );
      }
      setDay(readDay(data));
      setYesterdayExists(readYesterdayExists(data));
      setCopyDays(readCopyDays(data));
      setNamedMeals(readNamedMeals(data));
      setRecipes(readRecipes(data));
      setLastBodyWeight(readLastBodyWeight(data));
      setWeightSteady(readWeightSteady(data));
      setLoadedDate(requestedDate);
      return true;
    },
    [],
  );

  const cached = loadedDate === date ? null : peekJson(daysUrl(date));
  const contentReady = loadedDate === date || cached != null;
  const viewDay = cached != null ? readDay(cached) : day;
  const shownDay = contentReady && viewDay?.date === date ? viewDay : null;

  const load = useCallback(async () => {
    const requestedDate = date;
    setLoadError(false);
    onLoadStart?.();
    const dayUrl = daysUrl(requestedDate);
    const sessionUrl = sessionsUrl(requestedDate);
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
        (data) => applyDayPayload(requestedDate, data),
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
    prefetchGymCache();
  }, [applyDayPayload, begin, date, done, onLoadStart]);

  useLayoutEffect(() => {
    if (date.length > 0) {
      reset();
    }
    const payload = peekJson(daysUrl(date));
    if (payload != null) {
      applyDayPayload(date, payload);
      const session = peekJson(sessionsUrl(date));
      if (session != null) {
        setWorkoutState(session);
      }
      return;
    }
    setLoadError(false);
    setDay(null);
    setYesterdayExists(false);
    setCopyDays([]);
    setLastBodyWeight(null);
    setWeightSteady(false);
    setWorkoutState(null);
  }, [applyDayPayload, date, reset]);

  useEffect(() => {
    return subscribeDayCache((changed, next) => {
      if (changed !== dateRef.current) {
        return;
      }
      setDay(next);
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const cachedSession = cached != null ? peekJson(sessionsUrl(date)) : null;

  return {
    today,
    day,
    setDay,
    yesterdayExists:
      cached != null ? readYesterdayExists(cached) : yesterdayExists,
    copyDays: cached != null ? readCopyDays(cached) : copyDays,
    namedMeals: cached != null ? readNamedMeals(cached) : namedMeals,
    setNamedMeals,
    recipes: cached != null ? readRecipes(cached) : recipes,
    lastBodyWeight:
      cached != null ? readLastBodyWeight(cached) : lastBodyWeight,
    weightSteady: cached != null ? readWeightSteady(cached) : weightSteady,
    workoutState: cachedSession ?? workoutState,
    loadError: cached != null ? false : loadError,
    contentReady,
    shownDay,
    load,
  };
}
