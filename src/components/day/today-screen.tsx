"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useState } from "react";

import { TodayDateNav } from "@/components/day/today-date-nav";
import { TodayDatePickerSheet } from "@/components/day/today-date-picker-sheet";
import { TodayDayHeader } from "@/components/day/today-day-header";
import { TodayDayMark } from "@/components/day/today-day-mark";
import { TodayScreenBody } from "@/components/day/today-screen-body";
import { useTodayScreen } from "@/components/day/use-today-screen";
import { AppHeader } from "@/components/layout/app-header";
import { useDayMood } from "@/components/layout/day-mood";
import { useDiaryDensity } from "@/components/layout/diary-density-provider";
import { TodayDayTypeSkeleton } from "@/components/layout/today-loading-skeleton";
import { nutritionHistoryHref } from "@/lib/day/dates";
import { isTempId } from "@/lib/day/optimistic";
import { CATCH_UP_TITLE } from "@/lib/messages";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";

export function TodayScreen({
  initialDate,
  readOnly = false,
  fromSettings = false,
  aiCapture = false,
  aiText = false,
}: {
  initialDate?: string;
  readOnly?: boolean;
  fromSettings?: boolean;
  aiCapture?: boolean;
  aiText?: boolean;
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
    remainingMealTypes,
    dayHasItems,
    yesterdayExists,
    yesterdayHasFood,
    copyDays,
    namedMeals,
    lastBodyWeight,
    lastBodyWeightDate,
    lastWaist,
    lastWaistDate,
    accountAgeDays,
    goals,
    weightSteady,
    priorProteinHits,
    gymEnabled,
    effectiveTraining,
    reviewReady,
    retentionTail,
    earlyHabit,
    earlyHabitSnapshot,
    priorFoodLogDays,
    habitBridge,
    habitBridgeSnapshot,
    energyGoal,
    energyGoalHint,
    applyEnergyGoal,
    dismissEnergyGoal,
    energyGoalBusy,
    busy,
    loadError,
    loading,
    actionError,
    load,
    goToDate,
    goBy,
    createDay,
    copyYesterday,
    saveDayAsTemplate,
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
  } = useTodayScreen({ initialDate, readOnly, fromSettings });

  const fromHistory = readOnly;
  const { mood } = useDayMood();
  const { density } = useDiaryDensity();
  const compact = density === "compact";
  const [pickerOpen, setPickerOpen] = useState(false);
  const titleDate = format(new Date(`${date}T00:00:00`), "d MMMM", {
    locale: ru,
  });
  const canGoForward = date < today;
  const openingToday =
    isToday && !viewOnly && !shownDay && !loadError && !actionError;
  const showLoading = loading || !contentReady || openingToday;

  return (
    <div
      className={cn("flex w-full flex-col px-4", compact ? "gap-2" : "gap-3")}
    >
      <div className="today-chrome">
        <div className="today-chrome-head">
          <AppHeader
            className="px-0 pt-1.5 pb-2.5"
            title={titleDate}
            subtitle={
              viewOnly
                ? "Только просмотр"
                : catchUp
                  ? CATCH_UP_TITLE
                  : undefined
            }
            backHref={
              fromHistory ? nutritionHistoryHref(fromSettings) : undefined
            }
            titleExpanded={pickerOpen}
            mark={
              mood === "rest" || mood === "training" ? (
                <TodayDayMark training={mood === "training"} />
              ) : null
            }
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
        </div>
        {contentReady && shownDay ? (
          <TodayDayHeader
            date={date}
            today={today}
            writable={writable}
            catchUp={catchUp}
            viewOnly={viewOnly}
            fromHistory={fromHistory}
            isTrainingDay={effectiveTraining}
            busy={busy || isTempId(shownDay.id)}
            switchType={switchType}
            showDayTypeSwitch={gymEnabled}
          />
        ) : showLoading && gymEnabled && !viewOnly ? (
          <TodayDayTypeSkeleton />
        ) : null}
      </div>
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

      <TodayScreenBody
        contentReady={contentReady}
        isToday={isToday}
        viewOnly={viewOnly}
        showLoading={showLoading}
        loadError={loadError}
        actionError={actionError}
        load={load}
        shownDay={shownDay}
        gymEnabled={gymEnabled}
        catchUp={catchUp}
        yesterdayHasFood={yesterdayHasFood}
        busy={busy}
        createDay={createDay}
        copyYesterday={copyYesterday}
        date={date}
        today={today}
        writable={writable}
        visibleMeals={visibleMeals}
        hiddenMealKcal={hiddenMealKcal}
        hiddenMealTypes={hiddenMealTypes}
        fact={fact}
        remainingMealTypes={remainingMealTypes}
        dayHasItems={dayHasItems}
        yesterdayExists={yesterdayExists}
        retentionTail={retentionTail}
        earlyHabit={earlyHabit}
        earlyHabitSnapshot={earlyHabitSnapshot}
        priorFoodLogDays={priorFoodLogDays}
        habitBridge={habitBridge}
        habitBridgeSnapshot={habitBridgeSnapshot}
        energyGoal={energyGoal}
        energyGoalHint={energyGoalHint}
        applyEnergyGoal={applyEnergyGoal}
        dismissEnergyGoal={dismissEnergyGoal}
        energyGoalBusy={energyGoalBusy}
        goToDate={goToDate}
        copyDays={copyDays}
        namedMeals={namedMeals}
        lastBodyWeight={lastBodyWeight}
        lastBodyWeightDate={lastBodyWeightDate}
        lastWaist={lastWaist}
        lastWaistDate={lastWaistDate}
        accountAgeDays={accountAgeDays}
        goals={goals}
        weightSteady={weightSteady}
        priorProteinHits={priorProteinHits}
        reviewReady={reviewReady}
        effectiveTraining={effectiveTraining}
        gym={gym}
        saveBodyWeight={saveBodyWeight}
        saveWaist={saveWaist}
        saveDayAsTemplate={saveDayAsTemplate}
        fillMealFromTemplate={fillMealFromTemplate}
        copyMealFromDate={copyMealFromDate}
        applyNamedMeal={applyNamedMeal}
        saveNamedMeal={saveNamedMeal}
        shareMeal={shareMeal}
        shareNamedMeal={shareNamedMeal}
        deleteNamedMeal={deleteNamedMeal}
        deleteItem={deleteItem}
        aiCapture={aiCapture}
        aiText={aiText}
      />
    </div>
  );
}
