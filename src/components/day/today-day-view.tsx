"use client";

import { useRouter } from "next/navigation";

import { CopyYesterdayButton } from "@/components/day/copy-yesterday-button";
import { DaySummary } from "@/components/day/day-summary";
import { MealCard } from "@/components/day/meal-card";
import {
  CookieMark,
  Doodle,
  DUMBBELL_VIEWBOX,
  DumbbellMark,
} from "@/components/layout/doodles";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { todayHomeHref, withDateQuery } from "@/lib/day/dates";
import type { DayWithMeals } from "@/lib/day/map";
import { DAY_TYPE_LABELS, hiddenMealSlotsNote } from "@/lib/nutrition";
import type {
  CopyDayHint,
  DayType,
  MealItem,
  MealType,
  NamedMealHint,
} from "@/lib/types";

export function TodayDayView({
  date,
  writable,
  viewOnly,
  fromHistory,
  shownDay,
  visibleMeals,
  hiddenMealKcal,
  hiddenMealTypes,
  fact,
  remainingLine,
  dayHasItems,
  copyDays,
  namedMeals,
  lastBodyWeight,
  busy,
  switchType,
  saveBodyWeight,
  copyYesterday,
  copyMealFromDate,
  applyNamedMeal,
  saveNamedMeal,
  deleteNamedMeal,
  deleteItem,
}: {
  date: string;
  writable: boolean;
  viewOnly: boolean;
  fromHistory: boolean;
  shownDay: DayWithMeals;
  visibleMeals: DayWithMeals["meals"];
  hiddenMealKcal: number;
  hiddenMealTypes: MealType[];
  fact: { protein: number; fat: number; carbs: number; kcal: number };
  remainingLine: string | null;
  dayHasItems: boolean;
  copyDays: CopyDayHint[];
  namedMeals: NamedMealHint[];
  lastBodyWeight: number | null;
  busy: boolean;
  switchType: (dayType: DayType) => Promise<void>;
  saveBodyWeight: (value: number | null) => Promise<void>;
  copyYesterday: () => Promise<void>;
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
  deleteNamedMeal: (namedMealId: string, name: string) => Promise<void>;
  deleteItem: (item: MealItem) => Promise<void>;
}) {
  const router = useRouter();
  const hiddenNote = hiddenMealSlotsNote(
    hiddenMealKcal,
    hiddenMealTypes,
    shownDay.is_training_day,
  );

  return (
    <div className="flex flex-col gap-5">
      {viewOnly ? (
        <div className="animate-rise flex flex-col gap-3">
          <p className="text-base text-muted-foreground">
            {shownDay.is_training_day
              ? DAY_TYPE_LABELS.training
              : DAY_TYPE_LABELS.rest}
            {writable ? null : ". Это старый день — граммы уже не меняются."}
          </p>
          {fromHistory && writable ? (
            <Button
              className="h-12 w-full text-base"
              onClick={() => router.push(todayHomeHref(date))}
            >
              Исправить
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="animate-rise">
          <Segmented
            value={shownDay.is_training_day ? "training" : "rest"}
            disabled={busy}
            options={[
              {
                id: "rest",
                label: DAY_TYPE_LABELS.rest,
                icon: (
                  <Doodle className="size-4" viewBox="-12 -12 24 24">
                    <CookieMark />
                  </Doodle>
                ),
              },
              {
                id: "training",
                label: DAY_TYPE_LABELS.training,
                icon: (
                  <Doodle className="size-7" viewBox={DUMBBELL_VIEWBOX}>
                    <DumbbellMark />
                  </Doodle>
                ),
              },
            ]}
            onChange={(dayType) => void switchType(dayType)}
          />
        </div>
      )}

      <div className="animate-rise" style={{ animationDelay: "40ms" }}>
        <DaySummary
          day={shownDay}
          fact={fact}
          showWeight
          bodyWeight={shownDay.body_weight}
          lastBodyWeight={lastBodyWeight}
          onSaveBodyWeight={viewOnly ? undefined : saveBodyWeight}
          bodyWeightReadOnly={viewOnly}
          bodyWeightBusy={busy}
        />
      </div>

      {hiddenNote ? (
        <p className="px-1 text-sm text-muted-foreground">{hiddenNote}</p>
      ) : null}

      {visibleMeals.map((meal, index) => (
        <MealCard
          key={meal.id}
          mealType={meal.meal_type}
          items={meal.items.map((item) => ({
            id: item.id,
            name: item.name_snapshot,
            grams: item.grams,
            protein: item.protein,
            fat: item.fat,
            carbs: item.carbs,
            kcal: item.kcal,
          }))}
          itemHref={
            viewOnly
              ? undefined
              : (item) => withDateQuery(`/today/items/${item.id}`, date)
          }
          addHref={
            viewOnly
              ? undefined
              : withDateQuery(`/today/meals/${meal.id}/add`, date)
          }
          plateHref={
            viewOnly
              ? undefined
              : withDateQuery(`/today/meals/${meal.id}/plate`, date)
          }
          date={date}
          copyDays={copyDays}
          namedMeals={namedMeals}
          onCopyDate={
            viewOnly
              ? undefined
              : (sourceDate) =>
                  void copyMealFromDate(meal.id, meal.meal_type, sourceDate)
          }
          onApplyNamed={
            viewOnly
              ? undefined
              : (namedMealId) =>
                  void applyNamedMeal(meal.id, meal.meal_type, namedMealId)
          }
          onSaveNamed={
            viewOnly
              ? undefined
              : () => void saveNamedMeal(meal.id, meal.meal_type)
          }
          onDeleteNamed={
            viewOnly
              ? undefined
              : (namedMealId, name) => void deleteNamedMeal(namedMealId, name)
          }
          copyBusy={busy}
          readOnly={viewOnly}
          className="animate-rise"
          style={{ animationDelay: `${80 + index * 50}ms` }}
          onDeleteItem={
            viewOnly
              ? undefined
              : (item) => {
                  const row = meal.items.find((entry) => entry.id === item.id);
                  if (row) {
                    void deleteItem(row);
                  }
                }
          }
        />
      ))}

      {remainingLine ? (
        <p
          className="animate-rise px-1 text-base leading-relaxed text-muted-foreground"
          style={{
            animationDelay: `${80 + visibleMeals.length * 50}ms`,
          }}
        >
          {remainingLine}
        </p>
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
    </div>
  );
}
