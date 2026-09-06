"use client";

import type { CSSProperties } from "react";

import {
  MealAddLink,
  MealItemRow,
  type MealLine,
} from "@/components/day/meal-item-row";
import {
  formatKcal,
  formatMacro,
  getMealLabel,
  sumMealItems,
} from "@/lib/nutrition";
import type { MealType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MealCard({
  mealType,
  items,
  itemHref,
  addHref,
  onDeleteItem,
  className,
  style,
}: {
  mealType: MealType;
  items: MealLine[];
  itemHref: (item: MealLine) => string;
  addHref: string;
  onDeleteItem: (item: MealLine) => void;
  className?: string;
  style?: CSSProperties;
}) {
  const totals = sumMealItems(items);

  return (
    <section
      className={cn("card-surface flex flex-col gap-3 px-5 py-4", className)}
      style={style}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold">{getMealLabel(mealType)}</h2>
        {items.length > 0 ? (
          <p className="text-base font-semibold tabular-nums">
            {formatKcal(totals.kcal)} ккал
          </p>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="text-base text-muted-foreground">Пока пусто.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border/80">
          {items.map((item) => (
            <MealItemRow
              key={item.id}
              item={item}
              href={itemHref(item)}
              onDelete={() => onDeleteItem(item)}
            />
          ))}
        </div>
      )}

      {items.length > 0 ? (
        <p className="text-lg font-semibold tabular-nums tracking-tight">
          Б {formatMacro(totals.protein)} · Ж {formatMacro(totals.fat)} · У{" "}
          {formatMacro(totals.carbs)}
        </p>
      ) : null}

      <MealAddLink href={addHref} />
    </section>
  );
}
