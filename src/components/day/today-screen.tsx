"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CopyYesterdayButton } from "@/components/day/copy-yesterday-button";
import { CreateDayButtons } from "@/components/day/create-day-buttons";
import { DaySummary } from "@/components/day/day-summary";
import { MealCard } from "@/components/day/meal-card";
import {
  bannerFromTodayState,
  TodayWorkoutBanner,
} from "@/components/day/today-workout-banner";
import { AppHeader } from "@/components/layout/app-header";
import { useConfirm } from "@/components/layout/confirm-provider";
import {
  CookieMark,
  Doodle,
  DumbbellMark,
} from "@/components/layout/doodles";
import { useDayMood } from "@/components/layout/day-mood";
import { ScreenLoading } from "@/components/layout/screen-status";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { cachedGet, peekJson } from "@/lib/api-cache";
import {
  isIsoDate,
  nextIsoDate,
  nutritionHistoryHref,
  previousIsoDate,
  todayHistoryDayHref,
  todayHomeHref,
  withDateQuery,
} from "@/lib/day/dates";
import type { DayWithMeals } from "@/lib/day/map";
import { readDay } from "@/lib/day/today-payload";
import {
  DAY_EXISTS_REPLACE,
  LOAD_FAILED,
  readApiError,
  YESTERDAY_MISSING,
} from "@/lib/messages";
import { DAY_TYPE_LABELS, isMealVisible, sumMeals } from "@/lib/nutrition";
import type { DayType, MealItem } from "@/lib/types";
import { useFirstLoad } from "@/lib/use-first-load";

function todayIsoDate(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function resolveStartDate(value: string | undefined, today: string): string {
  if (value && isIsoDate(value) && value <= today) {
    return value;
  }
  return today;
}

export function TodayScreen({
  initialDate,
  readOnly = false,
  fromSettings = false,
}: {
  initialDate?: string;
  readOnly?: boolean;
  fromSettings?: boolean;
}) {
  const today = todayIsoDate();
  const router = useRouter();
  const [date, setDate] = useState(() => resolveStartDate(initialDate, today));
  const { setMood } = useDayMood();
  const confirm = useConfirm();
  const [day, setDay] = useState<DayWithMeals | null>(null);
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
    setDate(resolveStartDate(initialDate, todayIsoDate()));
  }, [initialDate]);

  const goToDate = useCallback(
    (next: string) => {
      const resolved = resolveStartDate(next, todayIsoDate());
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

    return shownDay.meals.filter(
      (meal) =>
        isMealVisible(meal.meal_type, shownDay.is_training_day) ||
        meal.items.length > 0,
    );
  }, [shownDay]);

  const fact = useMemo(() => sumMeals(visibleMeals), [visibleMeals]);

  async function createDay(dayType: DayType) {
    if (viewOnly) {
      return;
    }

    setBusy(true);
    setActionError(null);

    try {
      const response = await fetch("/api/days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, dayType }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setActionError(readApiError(data) ?? LOAD_FAILED);
        return;
      }

      setDay(readDay(data));
    } catch {
      setActionError(LOAD_FAILED);
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
        fetch("/api/days/copy-yesterday", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, replace: replaceFlag }),
        });

      let response = await post(replace);
      let data: unknown = await response.json().catch(() => null);

      if (response.status === 409) {
        const ok = await confirm({
          message: readApiError(data) ?? DAY_EXISTS_REPLACE,
          confirmLabel: "Заменить",
          cancelLabel: "Оставить",
          destructive: true,
        });
        if (!ok) {
          return;
        }
        response = await post(true);
        data = await response.json().catch(() => null);
      }

      if (response.status === 404) {
        setActionError(readApiError(data) ?? YESTERDAY_MISSING);
        return;
      }

      if (!response.ok) {
        setActionError(readApiError(data) ?? LOAD_FAILED);
        return;
      }

      setDay(readDay(data));
    } catch {
      setActionError(LOAD_FAILED);
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
      const response = await fetch(`/api/days/${day.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayType }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setActionError(readApiError(data) ?? LOAD_FAILED);
        return;
      }

      setDay(readDay(data));
    } catch {
      setActionError(LOAD_FAILED);
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
      const response = await fetch(`/api/meal-items/${item.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);
        setActionError(readApiError(data) ?? LOAD_FAILED);
        return;
      }

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
    } catch {
      setActionError(LOAD_FAILED);
    } finally {
      setBusy(false);
    }
  }

  const titleDate = format(new Date(`${date}T00:00:00`), "d MMMM", {
    locale: ru,
  });
  const canGoForward = date < today;
  const showLoading = !contentReady;

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title={titleDate}
        subtitle={viewOnly ? "Только просмотр" : undefined}
        backHref={fromHistory ? nutritionHistoryHref(fromSettings) : undefined}
        trailing={
          <>
            {fromHistory ? null : (
              <Link
                href="/today/history"
                className="flex size-11 items-center justify-center rounded-xl text-foreground transition-[background-color,transform] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted active:scale-95"
                aria-label="История еды"
              >
                <History className="size-5" />
              </Link>
            )}
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-xl text-foreground transition-[background-color,transform] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted active:scale-95"
              aria-label="Предыдущий день"
              onClick={() => goToDate(previousIsoDate(date))}
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-xl text-foreground transition-[background-color,transform] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted active:scale-95 disabled:opacity-30"
              aria-label="Следующий день"
              disabled={!canGoForward}
              onClick={() => {
                if (!canGoForward) {
                  return;
                }
                goToDate(nextIsoDate(date));
              }}
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        }
      />

      <div className="flex flex-col gap-5 px-4 pb-4">
        {contentReady && !loadError && banner ? (
          <TodayWorkoutBanner
            href={banner.href}
            title={banner.title}
            hint={banner.hint}
            label={banner.label}
          />
        ) : null}
        {showLoading ? <ScreenLoading /> : null}

        {contentReady && loadError ? (
          <div className="animate-rise flex flex-col items-center gap-3">
            <p className="text-center text-lg font-medium">{LOAD_FAILED}</p>
            <Button
              className="h-12 min-w-40 text-base"
              onClick={() => void load()}
            >
              Повторить
            </Button>
          </div>
        ) : null}

        {contentReady && !loadError && actionError ? (
          <p className="animate-rise text-center text-lg font-medium">
            {actionError}
          </p>
        ) : null}

        {contentReady && !loadError && !shownDay && !viewOnly ? (
          <div className="animate-rise flex flex-col gap-5">
            <CreateDayButtons
              busy={busy}
              trainingFirst={isToday}
              onCreateRest={() => void createDay("rest")}
              onCreateTraining={() => void createDay("training")}
              onCopyYesterday={() => void copyYesterday()}
            />
          </div>
        ) : null}

        {contentReady && !loadError && !shownDay && viewOnly ? (
          <p className="animate-rise text-center text-base text-muted-foreground">
            В этот день записей нет.
          </p>
        ) : null}

        {contentReady && !loadError && shownDay ? (
          <div className="flex flex-col gap-5">
            {viewOnly ? (
              <div className="animate-rise flex flex-col gap-3">
                <p className="text-base text-muted-foreground">
                  {shownDay.is_training_day
                    ? DAY_TYPE_LABELS.training
                    : DAY_TYPE_LABELS.rest}
                  {isToday
                    ? null
                    : ". Это старый день — граммы уже не меняются."}
                </p>
                {fromHistory && isToday ? (
                  <Button
                    className="h-12 w-full text-base"
                    onClick={() => router.push(todayHomeHref(date))}
                  >
                    Исправить
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="animate-rise">
                <Segmented
                  value={shownDay.is_training_day ? "training" : "rest"}
                  disabled={busy}
                  options={[
                    {
                      id: "rest",
                      label: DAY_TYPE_LABELS.rest,
                      icon: (
                        <Doodle
                          className="size-4"
                          viewBox="-12 -12 24 24"
                        >
                          <CookieMark />
                        </Doodle>
                      ),
                    },
                    {
                      id: "training",
                      label: DAY_TYPE_LABELS.training,
                      icon: (
                        <Doodle className="size-6" viewBox="-19 -8.2 38 16.4">
                          <DumbbellMark />
                        </Doodle>
                      ),
                    },
                  ]}
                  onChange={(dayType) => void switchType(dayType)}
                />
              </div>
            )}

            <div className="animate-rise" style={{ animationDelay: "40ms" }}>
              <DaySummary day={shownDay} fact={fact} />
            </div>

            {visibleMeals.map((meal, index) => (
              <MealCard
                key={meal.id}
                mealType={meal.meal_type}
                items={meal.items.map((item) => ({
                  id: item.id,
                  name: item.name_snapshot,
                  grams: item.grams,
                  protein: item.protein,
                  fat: item.fat,
                  carbs: item.carbs,
                  kcal: item.kcal,
                }))}
                itemHref={
                  viewOnly
                    ? undefined
                    : (item) => withDateQuery(`/today/items/${item.id}`, date)
                }
                addHref={
                  viewOnly
                    ? undefined
                    : withDateQuery(`/today/meals/${meal.id}/add`, date)
                }
                readOnly={viewOnly}
                className="animate-rise"
                style={{ animationDelay: `${80 + index * 50}ms` }}
                onDeleteItem={
                  viewOnly
                    ? undefined
                    : (item) => {
                        const row = meal.items.find(
                          (entry) => entry.id === item.id,
                        );
                        if (row) {
                          void deleteItem(row);
                        }
                      }
                }
              />
            ))}

            {viewOnly ? null : (
              <div
                className="animate-rise"
                style={{
                  animationDelay: `${80 + visibleMeals.length * 50}ms`,
                }}
              >
                <CopyYesterdayButton
                  busy={busy}
                  onCopy={() => void copyYesterday()}
                />
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
