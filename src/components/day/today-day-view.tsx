"use client";

import { ReviewCta } from "@/components/ai/review-cta";
import { useReviewOffer } from "@/components/ai/use-review-offer";
import { DaySummary } from "@/components/day/day-summary";
import {
  EnergyGoalCard,
  EnergyGoalHintCard,
} from "@/components/day/energy-goal-card";
import { MacroGapHint } from "@/components/day/macro-gap-hint";
import { ProteinCloseOffers } from "@/components/day/protein-close-offers";
import { SaveDayTemplateButton } from "@/components/day/save-day-template-button";
import { TodayDayMeals } from "@/components/day/today-day-meals";
import { TodayDayViewEmptyNudges } from "@/components/day/today-day-view-empty-nudges";
import { TodayDiaryLinks } from "@/components/day/today-diary-links";
import { TodayEmptyStart } from "@/components/day/today-empty-start";
import { TodayExtrasSection } from "@/components/day/today-extras-section";
import { TodayGymStatus } from "@/components/day/today-gym-status";
import { TodayQuickFoods } from "@/components/day/today-quick-foods";
import { useTodayDayDerived } from "@/components/day/use-today-day-derived";
import { useDiaryDensity } from "@/components/layout/diary-density-provider";
import { useTodayOrder } from "@/components/layout/today-order-provider";
import { WeekProgressShare } from "@/components/share/week-progress-share";
import type { GymLoop } from "@/lib/day/loop";
import type { DayWithMeals } from "@/lib/day/map";
import { isTempId } from "@/lib/day/optimistic";
import type { MacroGoals } from "@/lib/day/today-payload";
import type { EnergyGoalOffer } from "@/lib/nutrition/energy-goal";
import {
  MACRO_GAP_PROTEIN_MIN,
  todayStatusLine,
} from "@/lib/nutrition/macro-gap-hint";
import { macroRoomGrams } from "@/lib/nutrition/macro-hit";
import type { EarlyHabitSnapshot } from "@/lib/retention/habit";
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
  gym,
  busy,
  saveBodyWeight,
  saveWaist,
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
  gym: GymLoop;
  busy: boolean;
  saveBodyWeight: (value: number | null) => Promise<void>;
  saveWaist: (value: number | null) => Promise<void>;
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
  const { density } = useDiaryDensity();
  const { order } = useTodayOrder();
  const compact = density === "compact";
  const reviewOffer = useReviewOffer(reviewReady);
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
    <WeekProgressShare tone={compact ? "card" : "solid"} motion={!compact} />
  ) : null;

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
      foodStreakLine={foodStreakLine}
      trainingGap={trainingGap}
      weightGap={weightGap}
      waistGap={waistGap}
      share={writable}
      gym={gymEnabled ? <TodayGymStatus {...gym} /> : null}
      onSaveBodyWeight={viewOnly ? undefined : saveBodyWeight}
      onSaveWaist={viewOnly ? undefined : saveWaist}
      bodyWeightReadOnly={viewOnly}
      bodyWeightBusy={busy || isTempId(shownDay.id)}
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

  const numbersFirst = order === "numbers" && dayHasItems;
  const proteinCloseBlock =
    dayHasItems && !viewOnly ? (
      remainingProtein > MACRO_GAP_PROTEIN_MIN ? (
        <MacroGapHint
          date={date}
          meals={quickLogMeals}
          mealId={proteinLogMealId}
          onMealId={setQuickMealChoice}
          remainingProtein={remainingProtein}
          remainingFat={macroRoomGrams(fact.fat, shownDay.target_fat)}
          remainingCarbs={macroRoomGrams(fact.carbs, shownDay.target_carbs)}
          remainingKcal={shownDay.target_kcal - fact.kcal}
          busy={busy}
        />
      ) : (
        <ProteinCloseOffers
          date={date}
          meals={quickLogMeals}
          mealId={proteinLogMealId}
          onMealId={setQuickMealChoice}
          remainingProtein={remainingProtein}
          remainingFat={macroRoomGrams(fact.fat, shownDay.target_fat)}
          remainingCarbs={macroRoomGrams(fact.carbs, shownDay.target_carbs)}
          remainingKcal={shownDay.target_kcal - fact.kcal}
          busy={busy}
        />
      )
    ) : null;
  const quickFoods =
    dayHasItems && !viewOnly && quickLogMealId ? (
      <TodayQuickFoods
        date={date}
        meals={visibleMeals.map((meal) => ({
          id: meal.id,
          meal_type: meal.meal_type,
        }))}
        mealId={quickLogMealId}
        onMealId={setQuickMealChoice}
        busy={busy}
      />
    ) : null;

  const energyGoalBlock =
    date === today && !viewOnly && energyGoal ? (
      <EnergyGoalCard
        offer={energyGoal}
        busy={energyGoalBusy}
        onApply={onApplyEnergyGoal}
        onDismiss={() => onDismissEnergyGoal(energyGoal.restKcal)}
      />
    ) : null;
  const energyHintBlock =
    date === today && !viewOnly && !energyGoal && energyGoalHint ? (
      <EnergyGoalHintCard line={energyGoalHint} />
    ) : null;
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
  const scoreBlock = dayHasItems ? (
    <div
      className={cn(
        "animate-rise flex flex-col",
        compact ? "gap-1.5" : "gap-3",
      )}
    >
      {daySummary}
    </div>
  ) : null;

  const muscleNutritionBlock = muscleNutritionHint ? (
    <p className="text-sm text-muted-foreground">{muscleNutritionHint}</p>
  ) : null;

  const todayLine =
    date === today && dayHasItems
      ? todayStatusLine({
          protein: fact.protein,
          targetProtein: shownDay.target_protein,
        })
      : null;

  const closeTheDay =
    dayHasItems && !viewOnly ? (
      <>
        {energyGoalBlock}
        {energyHintBlock}
        {muscleNutritionBlock}
        {quickFoods}
        {proteinCloseBlock}
      </>
    ) : null;
  const extraNodes = [weekShare, reviewBlock].filter((node) => node != null);
  const todayExtras =
    !dayHasItems || extraNodes.length === 0 ? null : extraNodes.length === 1 ? (
      extraNodes[0]
    ) : (
      <TodayExtrasSection>{extraNodes}</TodayExtrasSection>
    );

  return (
    <div className={cn("flex w-full flex-col", compact ? "gap-1.5" : "gap-4")}>
      <TodayDayViewEmptyNudges
        dayHasItems={dayHasItems}
        topNudge={topNudge}
        habitSnapshot={habitSnapshot}
        habitBridgeSnapshot={habitBridgeSnapshot}
        compact={compact}
        gymEnabled={gymEnabled}
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

      {!dayHasItems ? <div className="animate-rise">{daySummary}</div> : null}

      {numbersFirst ? (
        <>
          {scoreBlock}
          {foodBlock}
          {closeTheDay}
        </>
      ) : (
        <>
          {foodBlock}
          {closeTheDay}
          {scoreBlock}
        </>
      )}

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
