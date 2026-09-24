"use client";

import { ReviewCta } from "@/components/ai/review-cta";
import { useReviewOffer } from "@/components/ai/use-review-offer";
import { DaySummary } from "@/components/day/day-summary";
import { RemainingRecipeAction } from "@/components/day/remaining-recipe-action";
import { SaveDayTemplateButton } from "@/components/day/save-day-template-button";
import { TodayDayHeader } from "@/components/day/today-day-header";
import { TodayDayMeals } from "@/components/day/today-day-meals";
import { TodayEmptyStart } from "@/components/day/today-empty-start";
import { TodayGymStatus } from "@/components/day/today-gym-status";
import {
  showYesterdayCatchUpHint,
  YesterdayCatchUpHint,
} from "@/components/day/yesterday-catch-up-hint";
import { useDiaryDensity } from "@/components/layout/diary-density-provider";
import { withDateQuery } from "@/lib/day/dates";
import type { GymLoop } from "@/lib/day/loop";
import type { DayWithMeals } from "@/lib/day/map";
import { isTempId } from "@/lib/day/optimistic";
import { hiddenMealSlotsNote } from "@/lib/nutrition";
import { emptyStartCopy } from "@/lib/retention";
import type {
  CopyDayHint,
  DayType,
  MealItem,
  MealType,
  NamedMealHint,
} from "@/lib/types";
import { cn } from "@/lib/utils";

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
  yesterdayExists,
  yesterdayHasFood,
  retentionTail,
  onOpenYesterday,
  copyDays,
  namedMeals,
  lastBodyWeight,
  lastWaist,
  weightSteady,
  priorProteinHits,
  reviewReady,
  gym,
  busy,
  switchType,
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
  startQueuedWorkout,
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
  yesterdayExists: boolean;
  yesterdayHasFood: boolean;
  retentionTail: boolean;
  onOpenYesterday: () => void;
  copyDays: CopyDayHint[];
  namedMeals: NamedMealHint[];
  lastBodyWeight: number | null;
  lastWaist: number | null;
  weightSteady: boolean;
  priorProteinHits: number;
  reviewReady: boolean;
  gym: GymLoop;
  busy: boolean;
  switchType: (dayType: DayType) => Promise<void>;
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
  startQueuedWorkout: (templateId: string) => Promise<void>;
}) {
  const { density } = useDiaryDensity();
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
  const firstMeal = visibleMeals.find((meal) => !isTempId(meal.id));
  const addPath = firstMeal ? `/today/meals/${firstMeal.id}/add` : null;
  const addHref = addPath ? withDateQuery(addPath, date, today) : null;
  const showEmptyStart = !viewOnly && !dayHasItems;
  const showSaveTemplate = !viewOnly && dayHasItems && !isTempId(shownDay.id);
  const startCopy = emptyStartCopy({
    retentionTail,
    isToday: date === today,
    viewOnly,
    dayHasItems,
    yesterdayHasFood,
  });

  return (
    <div className={cn("flex w-full flex-col", compact ? "gap-2" : "gap-4")}>
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

      {yesterdayCatchUp ? (
        <div className="animate-rise" style={{ animationDelay: "20ms" }}>
          <YesterdayCatchUpHint onOpen={onOpenYesterday} />
        </div>
      ) : null}

      <div className="animate-rise" style={{ animationDelay: "40ms" }}>
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
          share={writable}
          gym={
            <TodayGymStatus
              kind={gym.kind}
              label={gym.label}
              href={gym.href}
              templateId={gym.templateId}
              busy={busy}
              onStart={startQueuedWorkout}
            />
          }
          onSaveBodyWeight={viewOnly ? undefined : saveBodyWeight}
          onSaveWaist={viewOnly ? undefined : saveWaist}
          bodyWeightReadOnly={viewOnly}
          bodyWeightBusy={busy || isTempId(shownDay.id)}
        />
      </div>

      {showEmptyStart ? (
        <div className="animate-rise" style={{ animationDelay: "60ms" }}>
          <TodayEmptyStart
            yesterdayHasFood={yesterdayHasFood}
            copy={startCopy}
            addHref={addHref}
            busy={busy}
            onCopyYesterday={() => void copyYesterday()}
          />
        </div>
      ) : null}

      {hiddenNote ? (
        <p className="px-1 text-sm text-muted-foreground">{hiddenNote}</p>
      ) : null}

      {remainingFullGap && remainingAction ? (
        <div className="animate-rise" style={{ animationDelay: "80ms" }}>
          {remainingAction}
        </div>
      ) : null}

      {dayHasItems ? (
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
      ) : null}

      {showSaveTemplate ? (
        <div
          className="animate-rise"
          style={{
            animationDelay: `${80 + visibleMeals.length * 50}ms`,
          }}
        >
          <SaveDayTemplateButton
            isTrainingDay={shownDay.is_training_day}
            busy={busy}
            onSave={() => void saveDayAsTemplate()}
          />
        </div>
      ) : null}

      {remainingFullGap ? null : remainingAction ? (
        <div
          className="animate-rise"
          style={{
            animationDelay: `${80 + visibleMeals.length * 50 + (showSaveTemplate ? 50 : 0)}ms`,
          }}
        >
          {remainingAction}
        </div>
      ) : null}

      {viewOnly || !reviewOffer.show ? null : (
        <ReviewCta from="today" onOpen={reviewOffer.open} />
      )}
    </div>
  );
}
