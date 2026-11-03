"use client";

import { useEffect, useState } from "react";

import { ReviewCta } from "@/components/ai/review-cta";
import { useReviewOffer } from "@/components/ai/use-review-offer";
import { PlateFill } from "@/components/day/plate-fill";
import { SaveDayTemplateButton } from "@/components/day/save-day-template-button";
import { TodayDayMeals } from "@/components/day/today-day-meals";
import { TodayDayStrip } from "@/components/day/today-day-strip";
import { TodayDayViewCloseBlock } from "@/components/day/today-day-view-close-block";
import { TodayDayViewSummaryCard } from "@/components/day/today-day-view-summary-card";
import { TodayDiaryLinks } from "@/components/day/today-diary-links";
import { TodayEmptyStart } from "@/components/day/today-empty-start";
import { TodayExtrasSection } from "@/components/day/today-extras-section";
import { TodayGymAsk } from "@/components/day/today-gym-ask";
import { TodayHintSlot } from "@/components/day/today-hint-slot";
import { TodayNextSession } from "@/components/day/today-next-session";
import { useTodayDayDerived } from "@/components/day/use-today-day-derived";
import { useTodayWorkoutPeek } from "@/components/day/use-today-workout-peek";
import { useUndoToast } from "@/components/layout/undo-toast-provider";
import { WeekProgressShare } from "@/components/share/week-progress-share";
import type { DayWithMeals } from "@/lib/day/map";
import type { MacroGoals } from "@/lib/day/today-payload";
import { clearTrainingFlip, readTrainingFlip } from "@/lib/day/training-flip";
import type { EnergyGoalOffer } from "@/lib/nutrition/energy-goal";
import { todayStatusLine } from "@/lib/nutrition/macro-gap-hint";
import type { EarlyHabitSnapshot } from "@/lib/retention/habit";
import type { HabitBridgeSnapshot } from "@/lib/retention/habit-bridge";
import type {
  CopyDayHint,
  DayType,
  MealItem,
  MealType,
  NamedMealHint,
} from "@/lib/types";

export function TodayDayView({
  date,
  today,
  writable,
  viewOnly,
  shownDay,
  visibleMeals,
  hiddenMealKcal,
  hiddenMealTypes,
  fact,
  remainingMealTypes,
  dayHasItems,
  yesterdayExists,
  yesterdayHasFood,
  retentionTail,
  earlyHabit,
  earlyHabitSnapshot,
  priorFoodLogDays,
  habitBridge,
  habitBridgeSnapshot,
  energyGoal,
  energyGoalHint,
  onApplyEnergyGoal,
  onDismissEnergyGoal,
  energyGoalBusy,
  onOpenYesterday,
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
  gymEnabled,
  effectiveTraining,
  busy,
  saveBodyWeight,
  saveWaist,
  switchType,
  copyYesterday,
  saveDayAsTemplate,
  fillMealFromTemplate,
  copyMealFromDate,
  applyNamedMeal,
  saveNamedMeal,
  shareMeal,
  shareNamedMeal,
  deleteNamedMeal,
  deleteItem,
  aiCapture = false,
  aiText = false,
}: {
  date: string;
  today: string;
  writable: boolean;
  viewOnly: boolean;
  shownDay: DayWithMeals;
  visibleMeals: DayWithMeals["meals"];
  hiddenMealKcal: number;
  hiddenMealTypes: MealType[];
  fact: { protein: number; fat: number; carbs: number; kcal: number };
  remainingMealTypes: ReadonlySet<MealType>;
  dayHasItems: boolean;
  yesterdayExists: boolean;
  yesterdayHasFood: boolean;
  retentionTail: boolean;
  earlyHabit: boolean;
  earlyHabitSnapshot: EarlyHabitSnapshot | null;
  priorFoodLogDays: number;
  habitBridge: boolean;
  habitBridgeSnapshot: HabitBridgeSnapshot | null;
  energyGoal: EnergyGoalOffer | null;
  energyGoalHint: string | null;
  onApplyEnergyGoal: () => void;
  onDismissEnergyGoal: (dismissedKcal: number) => void;
  energyGoalBusy: boolean;
  onOpenYesterday: () => void;
  copyDays: CopyDayHint[];
  namedMeals: NamedMealHint[];
  lastBodyWeight: number | null;
  lastBodyWeightDate: string | null;
  lastWaist: number | null;
  lastWaistDate: string | null;
  accountAgeDays: number | null;
  goals: MacroGoals;
  weightSteady: boolean;
  priorProteinHits: number;
  reviewReady: boolean;
  gymEnabled: boolean;
  effectiveTraining: boolean;
  busy: boolean;
  saveBodyWeight: (value: number | null) => Promise<void>;
  saveWaist: (value: number | null) => Promise<void>;
  switchType: (dayType: DayType) => Promise<void>;
  copyYesterday: () => Promise<void>;
  saveDayAsTemplate: () => Promise<void>;
  fillMealFromTemplate: (mealId: string) => Promise<void>;
  copyMealFromDate: (
    mealId: string,
    mealType: MealType,
    sourceDate: string,
  ) => Promise<void>;
  applyNamedMeal: (
    mealId: string,
    mealType: MealType,
    namedMealId: string,
  ) => Promise<void>;
  saveNamedMeal: (mealId: string, mealType: MealType) => Promise<void>;
  shareMeal: (mealId: string) => Promise<void>;
  shareNamedMeal: (namedMealId: string) => Promise<void>;
  deleteNamedMeal: (namedMealId: string, name: string) => Promise<void>;
  deleteItem: (item: MealItem) => Promise<void>;
  aiCapture?: boolean;
  aiText?: boolean;
}) {
  const undo = useUndoToast();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const reviewOffer = useReviewOffer(reviewReady);
  const peek = useTodayWorkoutPeek(
    gymEnabled && date === today && !viewOnly,
    date,
  );
  useEffect(() => {
    if (viewOnly || readTrainingFlip() !== date) {
      return;
    }
    clearTrainingFlip();
    undo({
      message: "День — тренировка.",
      actionLabel: "Вернуть",
      onUndo: () => switchType("rest"),
    });
  }, [date, switchType, undo, viewOnly]);
  const {
    setQuickMealChoice,
    hiddenNote,
    remainingProtein,
    muscleNutritionHint,
    addHref,
    quickLogMealId,
    quickLogMeals,
    proteinLogMealId,
    showEmptyStart,
    emptyTextMeal,
    showSaveTemplate,
    proteinMealCount,
    trainingGap,
    weightGap,
    waistGap,
    startCopy,
    habitSnapshot,
    showWeekShare,
    topNudge,
    foodStreakLine,
  } = useTodayDayDerived({
    date,
    today,
    viewOnly,
    shownDay,
    visibleMeals,
    hiddenMealKcal,
    hiddenMealTypes,
    fact,
    dayHasItems,
    yesterdayExists,
    yesterdayHasFood,
    retentionTail,
    earlyHabit,
    earlyHabitSnapshot,
    priorFoodLogDays,
    habitBridge,
    habitBridgeSnapshot,
    accountAgeDays,
    goals,
    lastBodyWeightDate,
    lastWaistDate,
    priorProteinHits,
    gymEnabled,
    effectiveTraining,
    busy,
    aiText,
  });
  const weekShare = showWeekShare ? (
    <WeekProgressShare tone="card" motion={false} />
  ) : null;
  const filledMeals = visibleMeals.filter(
    (meal) => meal.items.length > 0,
  ).length;

  const daySummary = (
    <TodayDayViewSummaryCard
      shownDay={shownDay}
      fact={fact}
      lastBodyWeight={lastBodyWeight}
      lastWaist={lastWaist}
      weightSteady={weightSteady}
      priorProteinHits={priorProteinHits}
      foodStreakLine={foodStreakLine}
      trainingGap={trainingGap}
      weightGap={weightGap}
      waistGap={waistGap}
      writable={writable}
      viewOnly={viewOnly}
      busy={busy}
      saveBodyWeight={saveBodyWeight}
      saveWaist={saveWaist}
    />
  );

  const mealsBlock = dayHasItems ? (
    <TodayDayMeals
      date={date}
      today={today}
      viewOnly={viewOnly}
      visibleMeals={visibleMeals}
      remainingMealTypes={remainingMealTypes}
      dayProtein={fact.protein}
      proteinMealCount={proteinMealCount}
      copyDays={copyDays}
      namedMeals={namedMeals}
      busy={busy}
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
      logBusy={busy}
    />
  ) : null;

  const mealTail =
    dayHasItems && hiddenNote ? (
      <p className="px-1 text-sm text-muted-foreground">{hiddenNote}</p>
    ) : null;

  const closeTheDay = (
    <TodayDayViewCloseBlock
      dayHasItems={dayHasItems}
      viewOnly={viewOnly}
      date={date}
      shownDay={shownDay}
      fact={fact}
      quickLogMeals={quickLogMeals}
      quickLogMealId={quickLogMealId}
      proteinLogMealId={proteinLogMealId}
      remainingProtein={remainingProtein}
      muscleNutritionHint={summaryOpen ? muscleNutritionHint : null}
      showProtein={summaryOpen}
      onQuickMealChange={setQuickMealChoice}
      busy={busy}
      visibleMeals={visibleMeals}
    />
  );

  const reviewBlock =
    viewOnly || !reviewOffer.show ? null : (
      <ReviewCta from="today" onOpen={reviewOffer.open} />
    );

  const foodBlock = (
    <>
      {mealsBlock}
      {mealTail}
      {showSaveTemplate ? (
        <div className="animate-rise">
          <SaveDayTemplateButton
            isTrainingDay={shownDay.is_training_day}
            busy={busy}
            onSave={() => void saveDayAsTemplate()}
          />
        </div>
      ) : null}
    </>
  );
  const scoreBlock = summaryOpen ? (
    <div className="animate-rise flex flex-col gap-3">{daySummary}</div>
  ) : null;

  const todayLine =
    date === today && dayHasItems
      ? todayStatusLine({
          protein: fact.protein,
          targetProtein: shownDay.target_protein,
        })
      : null;

  const extraNodes = [weekShare, reviewBlock].filter((node) => node != null);
  const todayExtras =
    !dayHasItems || extraNodes.length === 0 ? null : extraNodes.length === 1 ? (
      extraNodes[0]
    ) : (
      <TodayExtrasSection>{extraNodes}</TodayExtrasSection>
    );

  return (
    <div className="flex w-full flex-col gap-3">
      <TodayDayStrip
        training={effectiveTraining}
        gymEnabled={gymEnabled}
        busy={busy}
        viewOnly={viewOnly}
        remainingKcal={shownDay.target_kcal - fact.kcal}
        remainingProtein={shownDay.target_protein - fact.protein}
        summaryOpen={summaryOpen}
        onToggleSummary={() => setSummaryOpen((open) => !open)}
        onSwitchType={switchType}
      />
      {scoreBlock}

      {date === today && gymEnabled && effectiveTraining && !viewOnly ? (
        <TodayNextSession peek={peek} />
      ) : null}

      {filledMeals < 4 ? <PlateFill filled={filledMeals} /> : null}

      {showEmptyStart && date === today && gymEnabled ? (
        <TodayGymAsk
          date={date}
          busy={busy}
          peek={peek}
          onSwitchType={switchType}
        />
      ) : null}

      {showEmptyStart ? (
        <div className="animate-rise">
          <TodayEmptyStart
            yesterdayHasFood={yesterdayHasFood}
            copy={startCopy}
            addHref={addHref}
            busy={busy}
            onCopyYesterday={() => void copyYesterday()}
            textMeal={emptyTextMeal}
          />
        </div>
      ) : null}

      {foodBlock}

      <TodayHintSlot
        dayHasItems={dayHasItems}
        topNudge={topNudge}
        habitSnapshot={habitSnapshot}
        onOpenYesterday={onOpenYesterday}
        date={date}
        today={today}
        viewOnly={viewOnly}
        energyGoal={energyGoal}
        energyGoalHint={energyGoalHint}
        energyGoalBusy={energyGoalBusy}
        onApplyEnergyGoal={onApplyEnergyGoal}
        onDismissEnergyGoal={onDismissEnergyGoal}
      />

      {closeTheDay}

      {todayLine ? (
        <p className="text-sm leading-snug text-muted-foreground">
          {todayLine}
        </p>
      ) : null}

      <TodayDiaryLinks />

      {todayExtras}

      {!dayHasItems ? weekShare : null}
      {!dayHasItems ? reviewBlock : null}
    </div>
  );
}
