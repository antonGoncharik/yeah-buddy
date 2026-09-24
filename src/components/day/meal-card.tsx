"use client";

import type { CSSProperties } from "react";

import { MealCopyActions } from "@/components/day/meal-copy-actions";
import {
  MealAddLink,
  MealItemRow,
  type MealLine,
} from "@/components/day/meal-item-row";
import { MealTypeMark } from "@/components/day/meal-type-mark";
import { useDiaryDensity } from "@/components/layout/diary-density-provider";
import { Button } from "@/components/ui/button";
import { SortableList } from "@/components/workout/sortable-list";
import { mealEmptyLine } from "@/lib/flavor";
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
  onDeleteItem,
  onReorderItems,
  date,
  copyDays,
  namedMeals,
  onCopyDate,
  onApplyNamed,
  onSaveNamed,
  onShareMeal,
  onShareNamed,
  onDeleteNamed,
  onFillTemplate,
  copyBusy = false,
  readOnly = false,
  proteinShare = null,
  className,
  style,
}: {
  mealType: MealType;
  items: MealLine[];
  itemHref?: (item: MealLine) => string;
  addHref?: string;
  onDeleteItem?: (item: MealLine) => void;
  onReorderItems?: (next: MealLine[]) => void;
  date?: string;
  copyDays?: CopyDayHint[];
  namedMeals?: NamedMealHint[];
  onCopyDate?: (sourceDate: string) => void;
  onApplyNamed?: (namedMealId: string) => void;
  onSaveNamed?: () => void;
  onShareMeal?: () => void;
  onShareNamed?: (namedMealId: string) => void;
  onDeleteNamed?: (namedMealId: string, name: string) => void;
  onFillTemplate?: () => void;
  copyBusy?: boolean;
  readOnly?: boolean;
  proteinShare?: string | null;
  className?: string;
  style?: CSSProperties;
}) {
  const { density } = useDiaryDensity();
  const compact = density === "compact";
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
          onShareMeal,
          onShareNamed,
          onDeleteNamed,
        }
      : null;
  const showAdd = !readOnly && Boolean(addHref);
  const showFill = !readOnly && Boolean(onFillTemplate);

  return (
    <section
      className={cn(
        "card-surface flex flex-col px-5",
        compact ? "gap-2 py-3" : "gap-3 py-5",
        className,
      )}
      style={style}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex min-w-0 items-center gap-2 text-xl font-semibold">
          <MealTypeMark mealType={mealType} />
          <span className="truncate">{getMealLabel(mealType)}</span>
        </h2>
        <div className="flex shrink-0 items-center gap-1">
          {items.length > 0 ? (
            <p className="text-base font-semibold tabular-nums">
              {formatKcal(totals.kcal)} ккал
            </p>
          ) : null}
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
              onShareMeal={copy.onShareMeal}
              onShareNamed={copy.onShareNamed}
              onDeleteNamed={copy.onDeleteNamed}
            />
          ) : null}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-base text-muted-foreground">
          {mealEmptyLine(mealType)}
        </p>
      ) : onReorderItems && !readOnly ? (
        <SortableList
          items={items}
          disabled={copyBusy}
          onReorder={onReorderItems}
          renderItem={(item) => (
            <MealItemRow
              item={item}
              href={itemHref ? itemHref(item) : undefined}
              onDelete={onDeleteItem ? () => onDeleteItem(item) : undefined}
            />
          )}
        />
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
        <p
          className={cn(
            "tabular-nums tracking-tight",
            compact ? "text-sm text-muted-foreground" : "text-lg font-semibold",
          )}
        >
          Б {formatMacro(totals.protein)} · Ж {formatMacro(totals.fat)} · У{" "}
          {formatMacro(totals.carbs)}
        </p>
      ) : null}

      {items.length > 0 && proteinShare ? (
        <p className="text-sm text-muted-foreground tabular-nums">
          {proteinShare}
        </p>
      ) : null}

      {showFill || showAdd ? (
        <div
          className={cn(
            "flex gap-2",
            compact && "[&_a]:h-10 [&_button]:h-10",
            compact && items.length > 0 && showAdd && showFill
              ? "flex-row *:min-w-0 *:flex-1"
              : "flex-col",
          )}
        >
          {showAdd && addHref ? (
            <MealAddLink href={addHref} prominent={items.length === 0} />
          ) : null}
          {showFill && onFillTemplate ? (
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full text-base"
              disabled={copyBusy}
              onClick={onFillTemplate}
            >
              Из шаблона
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
