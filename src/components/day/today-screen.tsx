"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  History,
  Sofa,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

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
import { useDayMood } from "@/components/layout/day-mood";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { cachedGet, peekJson } from "@/lib/api-cache";
import type { DayWithMeals } from "@/lib/days";
import { isIsoDate, nextIsoDate, previousIsoDate } from "@/lib/days";
import {
  DAY_EXISTS_REPLACE,
  LOAD_FAILED,
  readApiError,
  YESTERDAY_MISSING,
} from "@/lib/messages";
import { isMealVisible, sumMeals } from "@/lib/nutrition";
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

export function TodayScreen({ initialDate }: { initialDate?: string }) {
  const today = todayIsoDate();
  const [date, setDate] = useState(() => resolveStartDate(initialDate, today));
  const { setMood } = useDayMood();
  const confirm = useConfirm();
  const [day, setDay] = useState<DayWithMeals | null>(null);
  const [workoutState, setWorkoutState] = useState<unknown>(null);
  const { loading, begin, done, reset } = useFirstLoad();
  const [loadError, setLoadError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const banner = useMemo(
    () =>
      bannerFromTodayState(workoutState, {
        isToday: date === today,
        isTrainingDay: day?.is_training_day === true,
      }),
    [date, day?.is_training_day, today, workoutState],
  );

  const load = useCallback(async () => {
    setLoadError(false);
    setActionError(null);
    const dayUrl = `/api/days?date=${encodeURIComponent(date)}`;
    const sessionUrl = `/api/sessions?date=${encodeURIComponent(date)}`;
    const showCached = () => done(true);
    if (peekJson(dayUrl) != null || peekJson(sessionUrl) != null) {
      done(true);
    } else {
      begin();
    }

    const results = await Promise.all([
      cachedGet(
        dayUrl,
        (data) => {
          setDay(readDay(data));
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
          setWorkoutState(data);
          return true;
        },
        showCached,
      ).then(
        () => true,
        () => false,
      ),
    ]);

    if (!results.some((ok) => ok)) {
      setLoadError(true);
      done(false);
      return;
    }

    done(true);
  }, [begin, date, done]);

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
    if (!day) {
      if (!loading) {
        setMood(null);
      }
      return;
    }

    setMood(day.is_training_day ? "training" : "rest");
  }, [day, loading, setMood]);

  const visibleMeals = useMemo(() => {
    if (!day) {
      return [];
    }

    return day.meals.filter((meal) =>
      isMealVisible(meal.meal_type, day.is_training_day),
    );
  }, [day]);

  const fact = useMemo(() => sumMeals(visibleMeals), [visibleMeals]);

  async function createDay(dayType: DayType) {
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
    if (!day) {
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
    const ok = await confirm({
      message: "Удалить продукт?",
      confirmLabel: "Удалить",
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
  const isToday = date === today;
  const canGoForward = date < today;

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title={titleDate}
        subtitle={isToday ? undefined : "Не сегодня"}
        trailing={
          <>
            <Link
              href="/today/history"
              className="flex size-11 items-center justify-center rounded-xl text-foreground transition-[background-color,transform] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted active:scale-95"
              aria-label="История питания"
            >
              <History className="size-5" />
            </Link>
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-xl text-foreground transition-[background-color,transform] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted active:scale-95"
              aria-label="Предыдущий день"
              onClick={() => setDate(previousIsoDate(date))}
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
                setDate(nextIsoDate(date));
              }}
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        }
      />

      <div className="flex flex-col gap-5 px-4 pb-4">
        {!loading && !loadError && banner ? (
          <TodayWorkoutBanner
            href={banner.href}
            title={banner.title}
            hint={banner.hint}
            label={banner.label}
          />
        ) : null}
        {loading ? (
          <p className="animate-rise py-12 text-center text-lg text-muted-foreground">
            Загрузка…
          </p>
        ) : null}

        {!loading && loadError ? (
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

        {!loading && !loadError && actionError ? (
          <p className="animate-rise text-center text-lg font-medium">
            {actionError}
          </p>
        ) : null}

        {!loading && !loadError && !day ? (
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

        {!loading && !loadError && day ? (
          <div className="flex flex-col gap-5">
            <div className="animate-rise">
              <Segmented
                value={day.is_training_day ? "training" : "rest"}
                disabled={busy}
                options={[
                  {
                    id: "rest",
                    label: "Отдых",
                    icon: <Sofa className="size-4" aria-hidden />,
                  },
                  {
                    id: "training",
                    label: "Тренировка",
                    icon: <Dumbbell className="size-4" aria-hidden />,
                  },
                ]}
                onChange={(dayType) => void switchType(dayType)}
              />
            </div>

            <div className="animate-rise" style={{ animationDelay: "40ms" }}>
              <DaySummary day={day} fact={fact} />
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
                itemHref={(item) => `/today/items/${item.id}`}
                addHref={`/today/meals/${meal.id}/add`}
                className="animate-rise"
                style={{ animationDelay: `${80 + index * 50}ms` }}
                onDeleteItem={(item) => {
                  const row = meal.items.find((entry) => entry.id === item.id);
                  if (row) {
                    void deleteItem(row);
                  }
                }}
              />
            ))}

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
          </div>
        ) : null}
      </div>
    </div>
  );
}

function readDay(data: unknown): DayWithMeals | null {
  if (!data || typeof data !== "object" || !("day" in data) || !data.day) {
    return null;
  }

  return data.day as DayWithMeals;
}
