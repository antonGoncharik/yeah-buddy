"use client";

import { MealAddLink, MealItemRow } from "@/components/day/meal-item-row";
import {
  formatKcal,
  formatMacro,
  getMealLabel,
  sumMealItems,
} from "@/lib/nutrition";
import type { Meal, MealItem } from "@/lib/types";

export function MealCard({
  meal,
  onDeleteItem,
}: {
  meal: Meal & { items: MealItem[] };
  onDeleteItem: (item: MealItem) => void;
}) {
  const totals = sumMealItems(meal.items);

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {getMealLabel(meal.meal_type)}
        </h2>
        {meal.items.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            Б {formatMacro(totals.protein)} · Ж {formatMacro(totals.fat)} · У{" "}
            {formatMacro(totals.carbs)} · {formatKcal(totals.kcal)} ккал
          </p>
        ) : null}
      </div>

      {meal.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Пока пусто.</p>
      ) : (
        <div className="flex flex-col divide-y">
          {meal.items.map((item) => (
            <MealItemRow key={item.id} item={item} onDelete={onDeleteItem} />
          ))}
        </div>
      )}

      <MealAddLink mealId={meal.id} />
    </section>
  );
}
