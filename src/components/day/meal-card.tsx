"use client";

import type { CSSProperties } from "react";
import { MealCopyActions } from "@/components/day/meal-copy-actions";
import {
  MealAddLink,
  MealItemRow,
  type MealLine,
  MealPlateLink,
} from "@/components/day/meal-item-row";
import {
  formatKcal,
  formatMacro,
  getMealLabel,
  sumMealItems,
} from "@/lib/nutrition";
import type { CopyDayHint, MealType, NamedMealHint } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MealCard({
  mealType,
  items,
  itemHref,
  addHref,
  plateHref,
  onDeleteItem,
  date,
  copyDays,
  namedMeals,
  onCopyDate,
  onApplyNamed,
  onSaveNamed,
  onDeleteNamed,
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
  date?: string;
  copyDays?: CopyDayHint[];
  namedMeals?: NamedMealHint[];
  onCopyDate?: (sourceDate: string) => void;
  onApplyNamed?: (namedMealId: string) => void;
  onSaveNamed?: () => void;
  onDeleteNamed?: (namedMealId: string, name: string) => void;
  copyBusy?: boolean;
  readOnly?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const totals = sumMealItems(items);
  const copy =
    !readOnly &&
    date &&
    onCopyDate &&
    onApplyNamed &&
    onSaveNamed &&
    onDeleteNamed
      ? {
          date,
          onCopyDate,
          onApplyNamed,
          onSaveNamed,
          onDeleteNamed,
        }
      : null;
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

      {copy || showPlate || showAdd ? (
        <div className="flex flex-col gap-2">
          {copy ? (
            <MealCopyActions
              date={copy.date}
              mealType={mealType}
              hasItems={items.length > 0}
              copyDays={copyDays ?? []}
              namedMeals={namedMeals ?? []}
              busy={copyBusy}
              onCopyDate={copy.onCopyDate}
              onApplyNamed={copy.onApplyNamed}
              onSaveNamed={copy.onSaveNamed}
              onDeleteNamed={copy.onDeleteNamed}
            />
          ) : null}
          {showPlate && plateHref ? <MealPlateLink href={plateHref} /> : null}
          {showAdd && addHref ? <MealAddLink href={addHref} /> : null}
        </div>
      ) : null}
    </section>
  );
}
