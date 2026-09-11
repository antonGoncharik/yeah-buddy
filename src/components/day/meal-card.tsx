"use client";

import type { CSSProperties } from "react";

import {
  MealAddLink,
  MealItemRow,
  type MealLine,
  MealPlateLink,
} from "@/components/day/meal-item-row";
import { Button } from "@/components/ui/button";
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
  plateHref,
  onDeleteItem,
  onCopyYesterday,
  copyBusy = false,
  readOnly = false,
  className,
  style,
}: {
  mealType: MealType;
  items: MealLine[];
  itemHref?: (item: MealLine) => string;
  addHref?: string;
  plateHref?: string;
  onDeleteItem?: (item: MealLine) => void;
  onCopyYesterday?: () => void;
  copyBusy?: boolean;
  readOnly?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const totals = sumMealItems(items);
  const showCopy = !readOnly && Boolean(onCopyYesterday);
  const showAdd = !readOnly && Boolean(addHref);
  const showPlate = !readOnly && Boolean(plateHref);

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
              href={readOnly || !itemHref ? undefined : itemHref(item)}
              onDelete={
                readOnly || !onDeleteItem ? undefined : () => onDeleteItem(item)
              }
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

      {showCopy || showPlate || showAdd ? (
        <div className="flex flex-col gap-2">
          {showCopy ? (
            <Button
              type="button"
              variant={items.length === 0 ? "default" : "outline"}
              className="h-12 w-full text-base"
              disabled={copyBusy}
              onClick={onCopyYesterday}
            >
              Как вчера
            </Button>
          ) : null}
          {showPlate && plateHref ? <MealPlateLink href={plateHref} /> : null}
          {showAdd && addHref ? <MealAddLink href={addHref} /> : null}
        </div>
      ) : null}
    </section>
  );
}
