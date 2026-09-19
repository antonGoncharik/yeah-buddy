"use client";

import { formatKcal, formatMacro, getMealLabel } from "@/lib/nutrition";
import type { SharePackDetail } from "@/lib/share/types";

export function PackMealPreview({ pack }: { pack: SharePackDetail }) {
  const meal = pack.meal;
  if (!meal) {
    return null;
  }

  return (
    <section className="card-surface animate-rise flex flex-col gap-3 px-5 py-4">
      <div>
        <h2 className="text-lg font-semibold">{meal.name}</h2>
        <p className="text-sm text-muted-foreground">
          {getMealLabel(meal.meal_type)} · {formatKcal(meal.kcal)} ккал · белок{" "}
          {formatMacro(meal.protein)}
        </p>
      </div>
      {meal.items.map((item) => (
        <p
          key={`${item.name}-${item.grams}`}
          className="text-sm text-muted-foreground"
        >
          {item.name} · {item.grams} г
        </p>
      ))}
    </section>
  );
}
