"use client";

import { CreateDayButtons } from "@/components/day/create-day-buttons";
import { TodayDayView } from "@/components/day/today-day-view";
import { TodayPauseBanner } from "@/components/day/today-pause-banner";
import { ScreenError } from "@/components/layout/screen-status";
import { TodayLoadingSkeleton } from "@/components/layout/today-loading-skeleton";
import { previousIsoDate } from "@/lib/day/dates";
import type { GymLoop } from "@/lib/day/loop";
import type { DayWithMeals } from "@/lib/day/map";
import type { MacroGoals } from "@/lib/day/today-payload";
import { LOAD_FAILED } from "@/lib/messages";
import type { EnergyGoalOffer } from "@/lib/nutrition/energy-goal";
import type { EarlyHabitSnapshot } from "@/lib/retention/habit";
import type { HabitBridgeSnapshot } from "@/lib/retention/habit-bridge";
import type {
  CopyDayHint,
  MealItem,
  MealType,
  NamedMealHint,
} from "@/lib/types";

export function TodayScreenBody({
  contentReady,
  isToday,
  viewOnly,
  showLoading,
  loadError,
  actionError,
  load,
  shownDay,
  gymEnabled,
  catchUp,
  yesterdayHasFood,
  busy,
  createDay,
  copyYesterday,
  date,
  today,
  writable,
  visibleMeals,
  hiddenMealKcal,
  hiddenMealTypes,
  fact,
  remainingMealTypes,
  dayHasItems,
  yesterdayExists,
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
  goToDate,
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
  effectiveTraining,
  gym,
  saveBodyWeight,
  saveWaist,
  saveDayAsTemplate,
  fillMealFromTemplate,
  copyMealFromDate,
  applyNamedMeal,
  saveNamedMeal,
  shareMeal,
  shareNamedMeal,
  deleteNamedMeal,
  deleteItem,
  aiCapture,
  aiText,
}: {
  contentReady: boolean;
  isToday: boolean;
  viewOnly: boolean;
  showLoading: boolean;
  loadError: boolean;
  actionError: string | null;
  load: () => void | Promise<void>;
  shownDay: DayWithMeals | null;
  gymEnabled: boolean;
  catchUp: boolean;
  yesterdayHasFood: boolean;
  busy: boolean;
  createDay: (kind: "rest" | "training") => void | Promise<void>;
  copyYesterday: () => Promise<void>;
  date: string;
  today: string;
  writable: boolean;
  visibleMeals: DayWithMeals["meals"];
  hiddenMealKcal: number;
  hiddenMealTypes: MealType[];
  fact: { protein: number; fat: number; carbs: number; kcal: number };
  remainingMealTypes: ReadonlySet<MealType>;
  dayHasItems: boolean;
  yesterdayExists: boolean;
  retentionTail: boolean;
  earlyHabit: boolean;
  earlyHabitSnapshot: EarlyHabitSnapshot | null;
  priorFoodLogDays: number;
  habitBridge: boolean;
  habitBridgeSnapshot: HabitBridgeSnapshot | null;
  energyGoal: EnergyGoalOffer | null;
  energyGoalHint: string | null;
  applyEnergyGoal: () => void;
  dismissEnergyGoal: (dismissedKcal: number) => void;
  energyGoalBusy: boolean;
  goToDate: (date: string) => void;
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
  effectiveTraining: boolean;
  gym: GymLoop;
  saveBodyWeight: (value: number | null) => Promise<void>;
  saveWaist: (value: number | null) => Promise<void>;
  saveDayAsTemplate: (dayId: string) => Promise<void>;
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
  aiCapture: boolean;
  aiText: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 pb-4">
      {contentReady && isToday && !viewOnly ? <TodayPauseBanner /> : null}
      {showLoading ? <TodayLoadingSkeleton gym={gymEnabled} /> : null}

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
            trainingFirst={isToday && gymEnabled}
            showTraining={gymEnabled}
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
          energyGoal={isToday ? energyGoal : null}
          energyGoalHint={isToday ? energyGoalHint : null}
          onApplyEnergyGoal={applyEnergyGoal}
          onDismissEnergyGoal={dismissEnergyGoal}
          energyGoalBusy={energyGoalBusy}
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
          gymEnabled={gymEnabled}
          effectiveTraining={effectiveTraining}
          gym={gym}
          busy={busy}
          saveBodyWeight={saveBodyWeight}
          saveWaist={saveWaist}
          copyYesterday={copyYesterday}
          saveDayAsTemplate={() => saveDayAsTemplate(shownDay.id)}
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
      ) : null}
    </div>
  );
}
