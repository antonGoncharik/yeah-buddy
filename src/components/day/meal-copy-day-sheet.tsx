"use client";

import { SheetFrame } from "@/components/layout/sheet-frame";
import { Button } from "@/components/ui/button";
import type { NamedMealHint } from "@/lib/types";

export function MealCopyDaySheet({
  yesterday,
  dayBefore,
  namedMeals,
  hasYesterday,
  hasDayBefore,
  hasItems,
  busy = false,
  onCopyDate,
  onApplyNamed,
  onSaveNamed,
  onShareNamed,
  onDeleteNamed,
  onCancel,
}: {
  yesterday: string;
  dayBefore: string;
  namedMeals?: NamedMealHint[];
  hasYesterday?: boolean;
  hasDayBefore?: boolean;
  hasItems?: boolean;
  busy?: boolean;
  onCopyDate?: (date: string) => void;
  onApplyNamed?: (namedMealId: string) => void;
  onSaveNamed?: () => void;
  onShareNamed?: (namedMealId: string) => void;
  onDeleteNamed?: (namedMealId: string, name: string) => void;
  onCancel: () => void;
}) {
  return (
    <SheetFrame label="Ещё" onCancel={onCancel}>
      {hasYesterday && onCopyDate ? (
        <Button
          type="button"
          className="h-12 w-full text-base"
          disabled={busy}
          onClick={() => onCopyDate(yesterday)}
        >
          Как вчера
        </Button>
      ) : null}
      {hasDayBefore && onCopyDate ? (
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full text-base"
          disabled={busy}
          onClick={() => onCopyDate(dayBefore)}
        >
          Как позавчера
        </Button>
      ) : null}
      {namedMeals?.map((meal) => (
        <div key={meal.id} className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-12 min-w-0 flex-1 text-base"
            disabled={busy}
            onClick={() => onApplyNamed?.(meal.id)}
          >
            <span className="truncate">{meal.name}</span>
          </Button>
          {onShareNamed ? (
            <Button
              type="button"
              variant="ghost"
              className="h-12 shrink-0 px-3 text-base text-muted-foreground"
              disabled={busy}
              aria-label={`Поделиться ${meal.name}`}
              onClick={() => onShareNamed(meal.id)}
            >
              ↗
            </Button>
          ) : null}
          {onDeleteNamed ? (
            <Button
              type="button"
              variant="ghost"
              className="h-12 shrink-0 px-3 text-base text-muted-foreground"
              disabled={busy}
              aria-label={`Удалить ${meal.name}`}
              onClick={() => onDeleteNamed(meal.id, meal.name)}
            >
              ×
            </Button>
          ) : null}
        </div>
      ))}
      {hasItems && onSaveNamed ? (
        <Button
          type="button"
          variant="ghost"
          className="h-12 w-full text-base text-muted-foreground"
          disabled={busy}
          onClick={onSaveNamed}
        >
          Сохранить приём
        </Button>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        className="h-12 w-full text-base"
        onClick={onCancel}
      >
        Отмена
      </Button>
    </SheetFrame>
  );
}
