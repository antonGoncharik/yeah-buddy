"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";

import { SheetFrame } from "@/components/layout/sheet-frame";
import { Button } from "@/components/ui/button";
import type { CopyDayHint, NamedMealHint } from "@/lib/types";

export function MealCopyDaySheet({
  days,
  yesterday,
  dayBefore,
  namedMeals,
  hasYesterday,
  hasItems,
  busy = false,
  onCopyDate,
  onApplyNamed,
  onSaveNamed,
  onDeleteNamed,
  onPick,
  onCancel,
}: {
  days: CopyDayHint[];
  yesterday: string;
  dayBefore: string;
  namedMeals?: NamedMealHint[];
  hasYesterday?: boolean;
  hasItems?: boolean;
  busy?: boolean;
  onCopyDate?: (date: string) => void;
  onApplyNamed?: (namedMealId: string) => void;
  onSaveNamed?: () => void;
  onDeleteNamed?: (namedMealId: string, name: string) => void;
  onPick?: (date: string) => void;
  onCancel: () => void;
}) {
  const copyDate = onCopyDate ?? onPick;
  const otherDays = days.filter(
    (day) => day.date !== yesterday && day.date !== dayBefore,
  );
  const hasDayBefore = days.some((day) => day.date === dayBefore);

  return (
    <SheetFrame title="Ещё" onCancel={onCancel}>
      {hasYesterday && copyDate ? (
        <Button
          type="button"
          className="h-12 w-full text-base"
          disabled={busy}
          onClick={() => copyDate(yesterday)}
        >
          Как вчера
        </Button>
      ) : null}
      {hasDayBefore && copyDate ? (
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full text-base"
          disabled={busy}
          onClick={() => copyDate(dayBefore)}
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
      {otherDays.length > 0 && copyDate ? (
        <div className="flex max-h-[40vh] flex-col gap-2 overflow-y-auto">
          {otherDays.map((day) => (
            <Button
              key={day.date}
              type="button"
              variant="outline"
              className="h-12 w-full text-base"
              disabled={busy}
              onClick={() => copyDate(day.date)}
            >
              {copyDayLabel(day.date, yesterday, dayBefore)}
            </Button>
          ))}
        </div>
      ) : null}
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

function copyDayLabel(
  date: string,
  yesterday: string,
  dayBefore: string,
): string {
  const pretty = format(new Date(`${date}T00:00:00`), "d MMMM", { locale: ru });
  if (date === yesterday) {
    return `Вчера, ${pretty}`;
  }
  if (date === dayBefore) {
    return `Позавчера, ${pretty}`;
  }
  return pretty;
}
