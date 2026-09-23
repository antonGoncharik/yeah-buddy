"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useState } from "react";

import { CreateDayButtons } from "@/components/day/create-day-buttons";
import { TodayDateNav } from "@/components/day/today-date-nav";
import { TodayDatePickerSheet } from "@/components/day/today-date-picker-sheet";
import { TodayDayView } from "@/components/day/today-day-view";
import { useTodayScreen } from "@/components/day/use-today-screen";
import { GuideTipCard } from "@/components/guide/guide-tip-card";
import { useGuideTip } from "@/components/guide/use-guide-tip";
import { AppHeader } from "@/components/layout/app-header";
import { ScreenLoading } from "@/components/layout/screen-status";
import { Button } from "@/components/ui/button";
import { nutritionHistoryHref, previousIsoDate } from "@/lib/day/dates";
import { CATCH_UP_TITLE, LOAD_FAILED } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";

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
    writable,
    catchUp,
    viewOnly,
    contentReady,
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
    yesterdayExists,
    yesterdayHasFood,
    copyDays,
    namedMeals,
    lastBodyWeight,
    lastWaist,
    weightSteady,
    priorProteinHits,
    reviewReady,
    retentionTail,
    busy,
    loadError,
    actionError,
    load,
    goToDate,
    goBy,
    createDay,
    copyYesterday,
    clearDayFood,
    saveDayAsTemplate,
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
  } = useTodayScreen({ initialDate, readOnly, fromSettings });

  const fromHistory = readOnly;
  const guideTip = useGuideTip("today");
  const [pickerOpen, setPickerOpen] = useState(false);
  const titleDate = format(new Date(`${date}T00:00:00`), "d MMMM", {
    locale: ru,
  });
  const canGoForward = date < today;
  const openingToday =
    isToday && !viewOnly && !shownDay && !loadError && !actionError;
  const showLoading = !contentReady || openingToday;

  return (
    <div className="flex flex-col gap-4">
      <AppHeader
        title={titleDate}
        subtitle={
          viewOnly ? "Только просмотр" : catchUp ? CATCH_UP_TITLE : undefined
        }
        backHref={fromHistory ? nutritionHistoryHref(fromSettings) : undefined}
        titleExpanded={pickerOpen}
        onTitleClick={() => {
          haptic("tap");
          setPickerOpen(true);
        }}
        trailing={
          <TodayDateNav
            canGoForward={canGoForward}
            onPrev={() => goBy(-1)}
            onNext={() => goBy(1)}
          />
        }
      />
      {pickerOpen ? (
        <TodayDatePickerSheet
          date={date}
          today={today}
          onSelect={(next) => {
            setPickerOpen(false);
            if (next !== date) {
              goToDate(next);
            }
          }}
          onCancel={() => setPickerOpen(false)}
        />
      ) : null}

      <div className="flex flex-col gap-4 px-4 pb-4">
        {contentReady &&
        !loadError &&
        !viewOnly &&
        guideTip.tip &&
        !(retentionTail && isToday && !dayHasItems) ? (
          <GuideTipCard tip={guideTip.tip} onDismiss={guideTip.dismiss} />
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

        {contentReady &&
        !loadError &&
        !shownDay &&
        !viewOnly &&
        (!isToday || actionError) ? (
          <div className="animate-rise flex flex-col gap-5">
            <CreateDayButtons
              busy={busy}
              trainingFirst={isToday}
              showCopy={yesterdayHasFood}
              catchUp={catchUp}
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
            today={today}
            writable={writable}
            catchUp={catchUp}
            viewOnly={viewOnly}
            fromHistory={fromHistory}
            shownDay={shownDay}
            visibleMeals={visibleMeals}
            hiddenMealKcal={hiddenMealKcal}
            hiddenMealTypes={hiddenMealTypes}
            fact={fact}
            remainingLine={remainingLine}
            remainingFullGap={remainingFullGap}
            remainingMealTypes={remainingMealTypes}
            dayHasItems={dayHasItems}
            yesterdayExists={yesterdayExists}
            yesterdayHasFood={yesterdayHasFood}
            retentionTail={retentionTail && isToday}
            onOpenYesterday={() => goToDate(previousIsoDate(date))}
            copyDays={copyDays}
            namedMeals={namedMeals}
            lastBodyWeight={lastBodyWeight}
            lastWaist={lastWaist}
            weightSteady={weightSteady}
            priorProteinHits={priorProteinHits}
            reviewReady={reviewReady && isToday}
            gym={gym}
            busy={busy}
            switchType={switchType}
            saveBodyWeight={saveBodyWeight}
            saveWaist={saveWaist}
            copyYesterday={copyYesterday}
            clearStarterDay={() => {
              if (!shownDay) {
                return Promise.resolve();
              }
              return clearDayFood(shownDay.id);
            }}
            saveDayAsTemplate={() => {
              if (!shownDay) {
                return Promise.resolve();
              }
              return saveDayAsTemplate(shownDay.id);
            }}
            fillDayFromTemplate={() => {
              if (!shownDay) {
                return Promise.resolve();
              }
              return fillDayFromTemplate(shownDay.id);
            }}
            fillMealFromTemplate={fillMealFromTemplate}
            copyMealFromDate={copyMealFromDate}
            applyNamedMeal={applyNamedMeal}
            saveNamedMeal={saveNamedMeal}
            shareMeal={shareMeal}
            shareNamedMeal={shareNamedMeal}
            deleteNamedMeal={deleteNamedMeal}
            deleteItem={deleteItem}
            startQueuedWorkout={startQueuedWorkout}
          />
        ) : null}
      </div>
    </div>
  );
}
