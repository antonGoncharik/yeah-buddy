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
import type { DayType, MealItem, MealType } from "@/lib/types";

export function TodayDayView({
  date,
  isToday,
  viewOnly,
  fromHistory,
  shownDay,
  visibleMeals,
  hiddenMealKcal,
  hiddenMealTypes,
  fact,
  dayHasItems,
  yesterdayMealTypes,
  lastBodyWeight,
  busy,
  switchType,
  saveBodyWeight,
  copyYesterday,
  copyMealYesterday,
  deleteItem,
}: {
  date: string;
  isToday: boolean;
  viewOnly: boolean;
  fromHistory: boolean;
  shownDay: DayWithMeals;
  visibleMeals: DayWithMeals["meals"];
  hiddenMealKcal: number;
  hiddenMealTypes: MealType[];
  fact: { protein: number; fat: number; carbs: number; kcal: number };
  dayHasItems: boolean;
  yesterdayMealTypes: MealType[];
  lastBodyWeight: number | null;
  busy: boolean;
  switchType: (dayType: DayType) => Promise<void>;
  saveBodyWeight: (value: number | null) => Promise<void>;
  copyYesterday: () => Promise<void>;
  copyMealYesterday: (mealId: string, mealType: MealType) => Promise<void>;
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
            {isToday ? null : ". Это старый день — граммы уже не меняются."}
          </p>
          {fromHistory && isToday ? (
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
          onCopyYesterday={
            viewOnly || !yesterdayMealTypes.includes(meal.meal_type)
              ? undefined
              : () => void copyMealYesterday(meal.id, meal.meal_type)
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
