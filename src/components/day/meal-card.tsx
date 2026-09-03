"use client";

import type { CSSProperties } from "react";

import { MealAddLink, MealItemRow } from "@/components/day/meal-item-row";
import {
  formatKcal,
  formatMacro,
  getMealLabel,
  sumMealItems,
} from "@/lib/nutrition";
import type { Meal, MealItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MealCard({
  meal,
  onDeleteItem,
  className,
  style,
}: {
  meal: Meal & { items: MealItem[] };
  onDeleteItem: (item: MealItem) => void;
  className?: string;
  style?: CSSProperties;
}) {
  const totals = sumMealItems(meal.items);

  return (
    <section
      className={cn("card-surface flex flex-col gap-3 px-5 py-4", className)}
      style={style}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold">
          {getMealLabel(meal.meal_type)}
        </h2>
        {meal.items.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {formatKcal(totals.kcal)} ккал
          </p>
        ) : null}
      </div>

      {meal.items.length === 0 ? (
        <p className="text-base text-muted-foreground">Пока пусто.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border/80">
          {meal.items.map((item) => (
            <MealItemRow key={item.id} item={item} onDelete={onDeleteItem} />
          ))}
        </div>
      )}

      {meal.items.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          Б {formatMacro(totals.protein)} · Ж {formatMacro(totals.fat)} · У{" "}
          {formatMacro(totals.carbs)}
        </p>
      ) : null}

      <MealAddLink mealId={meal.id} />
    </section>
  );
}
