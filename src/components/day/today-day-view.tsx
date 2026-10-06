"use client";

import { useMemo } from "react";

import { ReviewCta } from "@/components/ai/review-cta";
import { useReviewOffer } from "@/components/ai/use-review-offer";
import { DaySummary } from "@/components/day/day-summary";
import { EarlyHabitCard } from "@/components/day/early-habit-card";
import { HabitBridgeCard } from "@/components/day/habit-bridge-card";
import { ProteinCloseOffers } from "@/components/day/protein-close-offers";
import { RemainingRecipeAction } from "@/components/day/remaining-recipe-action";
import { SaveDayTemplateButton } from "@/components/day/save-day-template-button";
import { TodayDayMeals } from "@/components/day/today-day-meals";
import { TodayDayStatus } from "@/components/day/today-day-status";
import { TodayEmptyStart } from "@/components/day/today-empty-start";
import { TodayGymStatus } from "@/components/day/today-gym-status";
import {
  showYesterdayCatchUpHint,
  YesterdayCatchUpHint,
} from "@/components/day/yesterday-catch-up-hint";
import { useDiaryDensity } from "@/components/layout/diary-density-provider";
import { useTodayOrder } from "@/components/layout/today-order-provider";
import { WeekProgressShare } from "@/components/share/week-progress-share";
import { withDateQuery } from "@/lib/day/dates";
import type { GymLoop } from "@/lib/day/loop";
import type { DayWithMeals } from "@/lib/day/map";
import { isTempId } from "@/lib/day/optimistic";
import type { MacroGoals } from "@/lib/day/today-payload";
import {
  proteinClosed,
  trainingDayGapLine,
  waistGapLine,
  weightGapLine,
} from "@/lib/flavor";
import { hiddenMealSlotsNote, sumMealItems } from "@/lib/nutrition";
import { emptyStartCopy } from "@/lib/retention";
import {
  buildEarlyHabitSnapshot,
  type EarlyHabitSnapshot,
} from "@/lib/retention/habit";
import type { HabitBridgeSnapshot } from "@/lib/retention/habit-bridge";
import type {
  CopyDayHint,
  MealItem,
  MealType,
  NamedMealHint,
} from "@/lib/types";
import { cn } from "@/lib/utils";

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
  remainingLine,
  remainingFullGap,
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
  gym,
  busy,
  saveBodyWeight,
  saveWaist,
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
  deleteItem,
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
  remainingLine: string | null;
  remainingFullGap: boolean;
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
  gym: GymLoop;
  busy: boolean;
  saveBodyWeight: (value: number | null) => Promise<void>;
  saveWaist: (value: number | null) => Promise<void>;
  copyYesterday: () => Promise<void>;
  saveDayAsTemplate: () => Promise<void>;
  fillDayFromTemplate: () => Promise<void>;
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
}) {
  const { density } = useDiaryDensity();
  const { order } = useTodayOrder();
  const compact = density === "compact";
  const hiddenNote = hiddenMealSlotsNote(
    hiddenMealKcal,
    hiddenMealTypes,
    shownDay.is_training_day,
  );
  const remainingAction = remainingLine ? (
    <RemainingRecipeAction
      remainingLine={remainingLine}
      fullGap={remainingFullGap}
      viewOnly={viewOnly}
      busy={busy}
      onFill={() => void fillDayFromTemplate()}
    />
  ) : null;
  const reviewOffer = useReviewOffer(reviewReady);
  const yesterdayCatchUp = showYesterdayCatchUpHint({
    isToday: date === today,
    yesterdayExists,
    viewOnly,
    retentionTail,
  });
  const closeMeal = [...visibleMeals]
    .reverse()
    .find((meal) => !isTempId(meal.id));
  const firstMeal = visibleMeals.find((meal) => !isTempId(meal.id));
  const addPath = firstMeal ? `/today/meals/${firstMeal.id}/add` : null;
  const addHref = addPath ? withDateQuery(addPath, date, today) : null;
  const showEmptyStart = !viewOnly && !dayHasItems;
  const showSaveTemplate = !viewOnly && dayHasItems && !isTempId(shownDay.id);
  const proteinMealCount = shownDay.meals.filter(
    (meal) => sumMealItems(meal.items).protein > 0,
  ).length;
  const trainingGap = trainingDayGapLine({
    training: shownDay.is_training_day,
    fact,
    rest: { protein: goals.restProtein, carbs: goals.restCarbs },
    day: { protein: shownDay.target_protein, carbs: shownDay.target_carbs },
  });
  const weightGap = weightGapLine({
    weight: shownDay.body_weight,
    lastWeightDate: lastBodyWeightDate,
    accountAgeDays,
    date,
    canLog: !viewOnly,
  });
  const waistGap = waistGapLine({
    waist: shownDay.waist_cm,
    lastWaistDate,
    accountAgeDays,
    date,
    canLog: !viewOnly,
  });
  const startCopy = emptyStartCopy({
    earlyHabit,
    isToday: date === today,
    viewOnly,
    dayHasItems,
    yesterdayHasFood,
  });
  const habitSnapshot = useMemo(() => {
    if (!earlyHabit || accountAgeDays == null) {
      return null;
    }
    const todayProteinClosed = proteinClosed(
      shownDay.target_protein - fact.protein,
      fact.protein,
    );
    return buildEarlyHabitSnapshot({
      accountAgeDays,
      todayHasFood: dayHasItems,
      priorFoodLogDays,
      todayProteinClosed,
      priorProteinHits,
      gymSessionsWeek: earlyHabitSnapshot?.gymSessionsWeek ?? 0,
    });
  }, [
    accountAgeDays,
    dayHasItems,
    earlyHabit,
    earlyHabitSnapshot?.gymSessionsWeek,
    fact.protein,
    priorFoodLogDays,
    priorProteinHits,
    shownDay.target_protein,
  ]);
  const showWeekShare = !viewOnly && date === today;
  const weekShare = showWeekShare ? (
    <WeekProgressShare tone={compact ? "card" : "solid"} motion={!compact} />
  ) : null;

  const topNudge = yesterdayCatchUp
    ? ("catch-up" as const)
    : habitSnapshot
      ? ("early-habit" as const)
      : habitBridge && habitBridgeSnapshot
        ? ("habit-bridge" as const)
        : null;

  const isViewingToday = date === today;
  const showDayGlance =
    !viewOnly && dayHasItems && isViewingToday && !showEmptyStart;

  const daySummary = (
    <DaySummary
      day={shownDay}
      fact={fact}
      showWeight
      bodyWeight={shownDay.body_weight}
      lastBodyWeight={lastBodyWeight}
      waist={shownDay.waist_cm}
      lastWaist={lastWaist}
      weightSteady={weightSteady}
      priorProteinHits={priorProteinHits}
      trainingGap={trainingGap}
      weightGap={weightGap}
      waistGap={waistGap}
      share={writable}
      gym={<TodayGymStatus {...gym} />}
      onSaveBodyWeight={viewOnly ? undefined : saveBodyWeight}
      onSaveWaist={viewOnly ? undefined : saveWaist}
      bodyWeightReadOnly={viewOnly}
      bodyWeightBusy={busy || isTempId(shownDay.id)}
      breakdown={showDayGlance}
    />
  );

  const mealsBlock = dayHasItems ? (
    <TodayDayMeals
      date={date}
      today={today}
      viewOnly={viewOnly}
      visibleMeals={visibleMeals}
      remainingMealTypes={remainingMealTypes}
      remainingFullGap={remainingFullGap}
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
    />
  ) : null;

  const mealTail = dayHasItems ? (
    <>
      {hiddenNote ? (
        <p className="px-1 text-sm text-muted-foreground">{hiddenNote}</p>
      ) : null}
      {remainingAction ? (
        <div className="animate-rise">{remainingAction}</div>
      ) : null}
    </>
  ) : null;

  const numbersFirst = order === "numbers" && dayHasItems;
  const glanceBlock = (
    <>
      {showDayGlance ? (
        <TodayDayStatus
          protein={fact.protein}
          targetProtein={shownDay.target_protein}
          kcal={fact.kcal}
          targetKcal={shownDay.target_kcal}
          gym={gym}
          isTrainingDay={shownDay.is_training_day}
          logFoodHref={addHref}
        />
      ) : null}
      {dayHasItems && !viewOnly ? (
        <ProteinCloseOffers
          date={date}
          mealId={closeMeal?.id ?? null}
          remainingProtein={shownDay.target_protein - fact.protein}
          busy={busy}
        />
      ) : null}
    </>
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
  const scoreBlock = dayHasItems ? (
    <div className="animate-rise">{daySummary}</div>
  ) : null;

  return (
    <div className={cn("flex w-full flex-col", compact ? "gap-2" : "gap-4")}>
      {!dayHasItems && topNudge === "catch-up" ? (
        <div className="animate-rise">
          <YesterdayCatchUpHint onOpen={onOpenYesterday} />
        </div>
      ) : null}
      {!dayHasItems && topNudge === "early-habit" && habitSnapshot ? (
        <div className="animate-rise">
          <EarlyHabitCard snapshot={habitSnapshot} compact={compact} />
        </div>
      ) : null}
      {!dayHasItems && topNudge === "habit-bridge" && habitBridgeSnapshot ? (
        <div className="animate-rise">
          <HabitBridgeCard snapshot={habitBridgeSnapshot} compact={compact} />
        </div>
      ) : null}

      {showEmptyStart ? (
        <div className="animate-rise">
          <TodayEmptyStart
            yesterdayHasFood={yesterdayHasFood}
            copy={startCopy}
            addHref={addHref}
            busy={busy}
            onCopyYesterday={() => void copyYesterday()}
          />
        </div>
      ) : null}

      {!dayHasItems ? <div className="animate-rise">{daySummary}</div> : null}

      {glanceBlock}
      {numbersFirst ? scoreBlock : foodBlock}
      {numbersFirst ? foodBlock : scoreBlock}

      {weekShare}

      {viewOnly || !reviewOffer.show ? null : (
        <ReviewCta from="today" onOpen={reviewOffer.open} />
      )}
    </div>
  );
}
