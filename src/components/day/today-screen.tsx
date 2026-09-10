"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { CopyYesterdayButton } from "@/components/day/copy-yesterday-button";
import { CreateDayButtons } from "@/components/day/create-day-buttons";
import { DaySummary } from "@/components/day/day-summary";
import { MealCard } from "@/components/day/meal-card";
import { TodayWorkoutBanner } from "@/components/day/today-workout-banner";
import { useTodayScreen } from "@/components/day/use-today-screen";
import { AppHeader } from "@/components/layout/app-header";
import {
  CookieMark,
  Doodle,
  DUMBBELL_VIEWBOX,
  DumbbellMark,
} from "@/components/layout/doodles";
import { ScreenLoading } from "@/components/layout/screen-status";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import {
  nextIsoDate,
  nutritionHistoryHref,
  previousIsoDate,
  todayHomeHref,
  withDateQuery,
} from "@/lib/day/dates";
import { LOAD_FAILED } from "@/lib/messages";
import { DAY_TYPE_LABELS } from "@/lib/nutrition";

export function TodayScreen({
  initialDate,
  readOnly = false,
  fromSettings = false,
}: {
  initialDate?: string;
  readOnly?: boolean;
  fromSettings?: boolean;
}) {
  const router = useRouter();
  const {
    date,
    today,
    isToday,
    viewOnly,
    contentReady,
    shownDay,
    banner,
    visibleMeals,
    fact,
    busy,
    loadError,
    actionError,
    load,
    goToDate,
    createDay,
    copyYesterday,
    switchType,
    deleteItem,
  } = useTodayScreen({ initialDate, readOnly, fromSettings });

  const fromHistory = readOnly;
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
                        <Doodle className="size-4" viewBox="-12 -12 24 24">
                          <CookieMark />
                        </Doodle>
                      ),
                    },
                    {
                      id: "training",
                      label: DAY_TYPE_LABELS.training,
                      icon: (
                        <Doodle className="size-7" viewBox={DUMBBELL_VIEWBOX}>
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
