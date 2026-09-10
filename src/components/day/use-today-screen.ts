"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { bannerFromTodayState } from "@/components/day/today-workout-banner";
import { useConfirm } from "@/components/layout/confirm-provider";
import { useDayMood } from "@/components/layout/day-mood";
import {
  ApiError,
  cachedGet,
  deleteJson,
  patchJson,
  peekJson,
  postJson,
} from "@/lib/api-cache";
import {
  calendarToday,
  isIsoDate,
  todayHistoryDayHref,
  todayHomeHref,
} from "@/lib/day/dates";
import type { DayWithMeals } from "@/lib/day/map";
import { readDay, readYesterdayExists } from "@/lib/day/today-payload";
import {
  DAY_EXISTS_REPLACE,
  LOAD_FAILED,
  YESTERDAY_MISSING,
} from "@/lib/messages";
import { isMealVisible, sumMeals } from "@/lib/nutrition";
import type { DayType, MealItem } from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";
import { readTodaySession } from "@/lib/workout/hub-payload";

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
  const today = calendarToday();
  const router = useRouter();
  const [date, setDate] = useState(() => resolveStartDate(initialDate, today));
  const { setMood } = useDayMood();
  const confirm = useConfirm();
  const [day, setDay] = useState<DayWithMeals | null>(null);
  const [yesterdayExists, setYesterdayExists] = useState(false);
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
  const viewOnly = fromHistory || !isToday;
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
          setDay(readDay(data));
          setYesterdayExists(readYesterdayExists(data));
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
      const resolved = resolveStartDate(next, calendarToday());
      setDate(resolved);
      const href = fromHistory
        ? todayHistoryDayHref(resolved, fromSettings)
        : todayHomeHref(resolved);
      router.replace(href, { scroll: false });
    },
    [fromHistory, fromSettings, router],
  );

  useEffect(() => {
    setDay(null);
    setYesterdayExists(false);
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

  const visibleMeals = useMemo(() => {
    if (!shownDay) {
      return [];
    }

    return shownDay.meals.filter((meal) =>
      isMealVisible(meal.meal_type, shownDay.is_training_day),
    );
  }, [shownDay]);

  const fact = useMemo(() => {
    if (!shownDay) {
      return { protein: 0, fat: 0, carbs: 0, kcal: 0 };
    }
    return sumMeals(shownDay.meals);
  }, [shownDay]);

  const hiddenMealKcal = useMemo(() => {
    if (!shownDay) {
      return 0;
    }
    return sumMeals(
      shownDay.meals.filter(
        (meal) =>
          !isMealVisible(meal.meal_type, shownDay.is_training_day) &&
          meal.items.length > 0,
      ),
    ).kcal;
  }, [shownDay]);

  const hiddenMealTypes = useMemo(() => {
    if (!shownDay) {
      return [];
    }
    return shownDay.meals
      .filter(
        (meal) =>
          !isMealVisible(meal.meal_type, shownDay.is_training_day) &&
          meal.items.length > 0,
      )
      .map((meal) => meal.meal_type);
  }, [shownDay]);

  async function createDay(dayType: DayType) {
    if (viewOnly) {
      return;
    }

    setBusy(true);
    setActionError(null);

    try {
      const data = await postJson("/api/days", { date, dayType });
      setDay(readDay(data));
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function copyYesterday() {
    if (viewOnly) {
      return;
    }

    let replace = false;
    if (day) {
      const ok = await confirm({
        message: DAY_EXISTS_REPLACE,
        confirmLabel: "Заменить",
        cancelLabel: "Оставить",
        destructive: true,
      });
      if (!ok) {
        return;
      }
      replace = true;
    }

    setBusy(true);
    setActionError(null);

    try {
      const post = (replaceFlag: boolean) =>
        postJson("/api/days/copy-yesterday", { date, replace: replaceFlag });

      let data: unknown;
      try {
        data = await post(replace);
      } catch (caught) {
        if (!(caught instanceof ApiError) || caught.status !== 409) {
          throw caught;
        }
        const ok = await confirm({
          message:
            caught.message === LOAD_FAILED
              ? DAY_EXISTS_REPLACE
              : caught.message,
          confirmLabel: "Заменить",
          cancelLabel: "Оставить",
          destructive: true,
        });
        if (!ok) {
          return;
        }
        data = await post(true);
      }

      setDay(readDay(data));
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 404) {
        setActionError(
          caught.message === LOAD_FAILED ? YESTERDAY_MISSING : caught.message,
        );
        return;
      }
      setActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function switchType(dayType: DayType) {
    if (viewOnly || !day) {
      return;
    }

    if (day.is_training_day === (dayType === "training")) {
      return;
    }

    setBusy(true);
    setActionError(null);

    try {
      const data = await patchJson(`/api/days/${day.id}`, { dayType });
      setDay(readDay(data));
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem(item: MealItem) {
    if (viewOnly) {
      return;
    }

    const ok = await confirm({
      message: "Убрать продукт?",
      confirmLabel: "Убрать",
      cancelLabel: "Оставить",
      destructive: true,
    });
    if (!ok) {
      return;
    }

    setBusy(true);
    setActionError(null);

    try {
      await deleteJson(`/api/meal-items/${item.id}`);

      setDay((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          meals: current.meals.map((meal) => ({
            ...meal,
            items: meal.items.filter((row) => row.id !== item.id),
          })),
        };
      });
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  async function startQueuedWorkout(templateId: string) {
    if (viewOnly) {
      return;
    }

    if (shownDay && !shownDay.is_training_day) {
      const ok = await confirm({
        message:
          "Этот день уже как отдых. Сделать тренировочным? Цели еды сменятся, полдник останется.",
        confirmLabel: "Сделать тренировочным",
        cancelLabel: "Отмена",
      });
      if (!ok) {
        return;
      }
    }

    setBusy(true);
    setActionError(null);
    try {
      const data = await postJson("/api/sessions", {
        session_date: date,
        template_id: templateId,
      });
      const created = readTodaySession(data);
      if (created) {
        router.push(`/workouts/sessions/${created.id}`);
        return;
      }
      await load();
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 400) {
        router.push("/workouts/exercises");
        return;
      }
      setActionError(caught instanceof Error ? caught.message : LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  const dayHasItems = Boolean(
    shownDay?.meals.some((meal) => meal.items.length > 0),
  );

  return {
    date,
    today,
    isToday,
    viewOnly,
    contentReady,
    shownDay,
    banner,
    visibleMeals,
    hiddenMealKcal,
    hiddenMealTypes,
    fact,
    dayHasItems,
    yesterdayExists,
    busy,
    loadError,
    actionError,
    load,
    goToDate,
    createDay,
    copyYesterday,
    switchType,
    deleteItem,
    startQueuedWorkout,
  };
}
