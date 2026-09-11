"use client";

import {
  DAY_TEMPLATE_TITLES,
  formatKcal,
  formatMacro,
  getMealLabel,
} from "@/lib/nutrition";
import type { SharePackDetail } from "@/lib/share/types";

export function PackMealsPreview({ pack }: { pack: SharePackDetail }) {
  const meals = pack.meals;
  if (!meals) {
    return null;
  }

  return (
    <>
      <section className="card-surface animate-rise flex flex-col gap-2 px-5 py-4">
        <h2 className="text-lg font-semibold">Цели</h2>
        <p className="text-sm text-muted-foreground">
          Отдых: белок {formatMacro(meals.goals.rest_protein)} · жир{" "}
          {formatMacro(meals.goals.rest_fat)} · углеводы{" "}
          {formatMacro(meals.goals.rest_carbs)}
        </p>
        <p className="text-sm text-muted-foreground">
          Зал: белок {formatMacro(meals.goals.training_protein)} · жир{" "}
          {formatMacro(meals.goals.training_fat)} · углеводы{" "}
          {formatMacro(meals.goals.training_carbs)}
        </p>
      </section>

      {meals.days.map((day) => (
        <section
          key={day.day_type}
          className="card-surface animate-rise flex flex-col gap-3 px-5 py-4"
        >
          <div>
            <h2 className="text-lg font-semibold">
              {DAY_TEMPLATE_TITLES[day.day_type]}
            </h2>
            <p className="text-sm text-muted-foreground">
              {formatKcal(day.kcal)} ккал · белок {formatMacro(day.protein)} ·
              жир {formatMacro(day.fat)} · углеводы {formatMacro(day.carbs)}
            </p>
          </div>
          {day.meals.map((meal) => (
            <div key={meal.meal_type} className="flex flex-col gap-1">
              <p className="text-sm font-medium">
                {getMealLabel(meal.meal_type)}
              </p>
              {meal.items.map((item) => (
                <p
                  key={`${meal.meal_type}-${item.name}-${item.grams}`}
                  className="text-sm text-muted-foreground"
                >
                  {item.name} · {item.grams} г
                </p>
              ))}
            </div>
          ))}
        </section>
      ))}
    </>
  );
}
