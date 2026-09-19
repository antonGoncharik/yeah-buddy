"use client";

import { ReviewCta } from "@/components/ai/review-cta";
import { useReviewOffer } from "@/components/ai/use-review-offer";
import { CopyYesterdayButton } from "@/components/day/copy-yesterday-button";
import { DaySummary } from "@/components/day/day-summary";
import { RemainingRecipeAction } from "@/components/day/remaining-recipe-action";
import { TodayDayHeader } from "@/components/day/today-day-header";
import { TodayDayMeals } from "@/components/day/today-day-meals";
import type { DayWithMeals } from "@/lib/day/map";
import { isTempId } from "@/lib/day/optimistic";
import { hiddenMealSlotsNote } from "@/lib/nutrition";
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
  catchUp,
  viewOnly,
  fromHistory,
  shownDay,
  visibleMeals,
  hiddenMealKcal,
  hiddenMealTypes,
  fact,
  remainingLine,
  remainingFullGap,
  remainingMealTypes,
  dayHasItems,
  copyDays,
  namedMeals,
  lastBodyWeight,
  weightSteady,
  priorProteinHits,
  reviewReady,
  busy,
  switchType,
  saveBodyWeight,
  copyYesterday,
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
  catchUp: boolean;
  viewOnly: boolean;
  fromHistory: boolean;
  shownDay: DayWithMeals;
  visibleMeals: DayWithMeals["meals"];
  hiddenMealKcal: number;
  hiddenMealTypes: MealType[];
  fact: { protein: number; fat: number; carbs: number; kcal: number };
  remainingLine: string | null;
  remainingFullGap: boolean;
  remainingMealTypes: ReadonlySet<MealType>;
  dayHasItems: boolean;
  copyDays: CopyDayHint[];
  namedMeals: NamedMealHint[];
  lastBodyWeight: number | null;
  weightSteady: boolean;
  priorProteinHits: number;
  reviewReady: boolean;
  busy: boolean;
  switchType: (dayType: DayType) => Promise<void>;
  saveBodyWeight: (value: number | null) => Promise<void>;
  copyYesterday: () => Promise<void>;
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

  return (
    <div className="flex flex-col gap-4">
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

      <div className="animate-rise" style={{ animationDelay: "40ms" }}>
        <DaySummary
          day={shownDay}
          fact={fact}
          showWeight
          bodyWeight={shownDay.body_weight}
          lastBodyWeight={lastBodyWeight}
          weightSteady={weightSteady}
          priorProteinHits={priorProteinHits}
          share={writable}
          onSaveBodyWeight={viewOnly ? undefined : saveBodyWeight}
          bodyWeightReadOnly={viewOnly}
          bodyWeightBusy={busy || isTempId(shownDay.id)}
        />
      </div>

      {hiddenNote ? (
        <p className="px-1 text-sm text-muted-foreground">{hiddenNote}</p>
      ) : null}

      {remainingFullGap && remainingAction ? (
        <div className="animate-rise" style={{ animationDelay: "60ms" }}>
          {remainingAction}
        </div>
      ) : null}

      <TodayDayMeals
        date={date}
        today={today}
        viewOnly={viewOnly}
        visibleMeals={visibleMeals}
        remainingMealTypes={remainingMealTypes}
        remainingFullGap={remainingFullGap}
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

      {remainingFullGap ? null : remainingAction ? (
        <div
          className="animate-rise"
          style={{
            animationDelay: `${80 + visibleMeals.length * 50}ms`,
          }}
        >
          {remainingAction}
        </div>
      ) : null}

      {viewOnly || dayHasItems ? null : (
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

      {viewOnly || !reviewOffer.show ? null : (
        <ReviewCta from="today" onOpen={reviewOffer.open} />
      )}
    </div>
  );
}
