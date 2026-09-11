"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";

import { CreateDayButtons } from "@/components/day/create-day-buttons";
import { TodayDateNav } from "@/components/day/today-date-nav";
import { TodayDayView } from "@/components/day/today-day-view";
import { TodayWorkoutBanner } from "@/components/day/today-workout-banner";
import { useTodayScreen } from "@/components/day/use-today-screen";
import { AppHeader } from "@/components/layout/app-header";
import { ScreenLoading } from "@/components/layout/screen-status";
import { Button } from "@/components/ui/button";
import { nutritionHistoryHref } from "@/lib/day/dates";
import { LOAD_FAILED } from "@/lib/messages";

export function TodayScreen({
  initialDate,
  readOnly = false,
  fromSettings = false,
}: {
  initialDate?: string;
  readOnly?: boolean;
  fromSettings?: boolean;
}) {
  const {
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
    yesterdayMealTypes,
    lastBodyWeight,
    busy,
    loadError,
    actionError,
    load,
    goToDate,
    createDay,
    copyYesterday,
    copyMealYesterday,
    switchType,
    saveBodyWeight,
    deleteItem,
    startQueuedWorkout,
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
          <TodayDateNav
            date={date}
            fromHistory={fromHistory}
            canGoForward={canGoForward}
            onGoToDate={goToDate}
          />
        }
      />

      <div className="flex flex-col gap-5 px-4 pb-4">
        {contentReady && !loadError && banner ? (
          <TodayWorkoutBanner
            href={banner.href}
            title={banner.title}
            hint={banner.hint}
            label={banner.label}
            templateId={banner.templateId}
            busy={busy}
            onStart={startQueuedWorkout}
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
            <p className="text-base leading-relaxed text-muted-foreground">
              Скопируется еда на день. Отдых или зал — от этого цели.
            </p>
            <CreateDayButtons
              busy={busy}
              trainingFirst={isToday}
              showCopy={yesterdayExists}
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
          <TodayDayView
            date={date}
            isToday={isToday}
            viewOnly={viewOnly}
            fromHistory={fromHistory}
            shownDay={shownDay}
            visibleMeals={visibleMeals}
            hiddenMealKcal={hiddenMealKcal}
            hiddenMealTypes={hiddenMealTypes}
            fact={fact}
            dayHasItems={dayHasItems}
            yesterdayMealTypes={yesterdayMealTypes}
            lastBodyWeight={lastBodyWeight}
            busy={busy}
            switchType={switchType}
            saveBodyWeight={saveBodyWeight}
            copyYesterday={copyYesterday}
            copyMealYesterday={copyMealYesterday}
            deleteItem={deleteItem}
          />
        ) : null}
      </div>
    </div>
  );
}
