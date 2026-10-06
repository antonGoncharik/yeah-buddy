"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useState } from "react";

import { CreateDayButtons } from "@/components/day/create-day-buttons";
import { TodayDateNav } from "@/components/day/today-date-nav";
import { TodayDatePickerSheet } from "@/components/day/today-date-picker-sheet";
import { TodayDayHeader } from "@/components/day/today-day-header";
import { TodayDiaryLinks } from "@/components/day/today-diary-links";
import { TodayDayView } from "@/components/day/today-day-view";
import { useTodayScreen } from "@/components/day/use-today-screen";
import { GuideTipCard } from "@/components/guide/guide-tip-card";
import { useGuideTip } from "@/components/guide/use-guide-tip";
import { AppHeader } from "@/components/layout/app-header";
import { useDiaryDensity } from "@/components/layout/diary-density-provider";
import { ScreenError, ScreenLoading } from "@/components/layout/screen-status";
import { nutritionHistoryHref, previousIsoDate } from "@/lib/day/dates";
import { isTempId } from "@/lib/day/optimistic";
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
    lastBodyWeightDate,
    lastWaist,
    lastWaistDate,
    accountAgeDays,
    goals,
    weightSteady,
    priorProteinHits,
    reviewReady,
    retentionTail,
    earlyHabit,
    earlyHabitSnapshot,
    priorFoodLogDays,
    habitBridge,
    habitBridgeSnapshot,
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
  } = useTodayScreen({ initialDate, readOnly, fromSettings });

  const fromHistory = readOnly;
  const { density } = useDiaryDensity();
  const compact = density === "compact";
  const guideTip = useGuideTip("today");
  const dayTypeTip = useGuideTip("day-type");
  const [pickerOpen, setPickerOpen] = useState(false);
  const titleDate = format(new Date(`${date}T00:00:00`), "d MMMM", {
    locale: ru,
  });
  const canGoForward = date < today;
  const openingToday =
    isToday && !viewOnly && !shownDay && !loadError && !actionError;
  const showLoading = loading || !contentReady || openingToday;

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="today-chrome">
        <AppHeader
          className="px-0 py-2.5"
          title={titleDate}
          subtitle={
            viewOnly ? "Только просмотр" : catchUp ? CATCH_UP_TITLE : undefined
          }
          backHref={
            fromHistory ? nutritionHistoryHref(fromSettings) : undefined
          }
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
        {contentReady && shownDay ? (
          <TodayDayHeader
            date={date}
            today={today}
            writable={writable}
            catchUp={catchUp}
            viewOnly={viewOnly}
            fromHistory={fromHistory}
            isTrainingDay={shownDay.is_training_day}
            busy={busy || isTempId(shownDay.id)}
            switchType={switchType}
          />
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

      <div className="flex flex-col gap-4 px-4 pb-4">
        {contentReady &&
        !loadError &&
        !viewOnly &&
        !compact &&
        guideTip.tip &&
        !dayTypeTip.tip &&
        !(earlyHabit && isToday && !dayHasItems) ? (
          <GuideTipCard tip={guideTip.tip} onDismiss={guideTip.dismiss} />
        ) : null}
        {showLoading ? <ScreenLoading /> : null}

        {contentReady && loadError ? (
          <ScreenError message={LOAD_FAILED} onRetry={() => void load()} />
        ) : null}

        {contentReady && !loadError && actionError ? (
          <ScreenError message={actionError} />
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
            viewOnly={viewOnly}
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
            earlyHabit={earlyHabit && isToday}
            earlyHabitSnapshot={earlyHabitSnapshot}
            priorFoodLogDays={priorFoodLogDays}
            habitBridge={habitBridge && isToday}
            habitBridgeSnapshot={habitBridgeSnapshot}
            onOpenYesterday={() => goToDate(previousIsoDate(date))}
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
            reviewReady={reviewReady && isToday}
            gym={gym}
            busy={busy}
            saveBodyWeight={saveBodyWeight}
            saveWaist={saveWaist}
            copyYesterday={copyYesterday}
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
          />
        ) : null}
        {contentReady && shownDay ? (
          <TodayDiaryLinks className="border-t border-border pt-4" />
        ) : null}
      </div>
    </div>
  );
}
