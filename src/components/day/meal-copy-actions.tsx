"use client";

import { useMemo, useState } from "react";

import { MealCopyDaySheet } from "@/components/day/meal-copy-day-sheet";
import { Button } from "@/components/ui/button";
import { previousIsoDate } from "@/lib/day/dates";
import { namedMealsOfType } from "@/lib/named-meal/map";
import type { CopyDayHint, MealType, NamedMealHint } from "@/lib/types";

export function MealCopyActions({
  date,
  mealType,
  hasItems,
  copyDays,
  namedMeals,
  busy,
  onCopyDate,
  onApplyNamed,
  onSaveNamed,
  onDeleteNamed,
  onFillTemplate,
}: {
  date: string;
  mealType: MealType;
  hasItems: boolean;
  copyDays: CopyDayHint[];
  namedMeals: NamedMealHint[];
  busy: boolean;
  onCopyDate: (sourceDate: string) => void;
  onApplyNamed: (namedMealId: string) => void;
  onSaveNamed: () => void;
  onDeleteNamed: (namedMealId: string, name: string) => void;
  onFillTemplate?: () => void;
}) {
  const [picking, setPicking] = useState(false);
  const yesterday = previousIsoDate(date);
  const dayBefore = previousIsoDate(yesterday);
  const named = namedMealsOfType(namedMeals, mealType);
  const sources = useMemo(
    () => copyDays.filter((day) => day.mealTypes.includes(mealType)),
    [copyDays, mealType],
  );
  const hasYesterday = sources.some((day) => day.date === yesterday);
  const hasDayBefore = sources.some((day) => day.date === dayBefore);
  const otherDays = sources.filter(
    (day) => day.date !== yesterday && day.date !== dayBefore,
  );

  return (
    <div className="flex flex-col gap-2">
      {onFillTemplate ? (
        <Button
          type="button"
          variant={hasItems ? "outline" : "default"}
          className="h-12 w-full text-base"
          disabled={busy}
          onClick={onFillTemplate}
        >
          Добить из шаблона
        </Button>
      ) : null}
      {hasYesterday ? (
        <Button
          type="button"
          variant={hasItems || onFillTemplate ? "outline" : "default"}
          className="h-12 w-full text-base"
          disabled={busy}
          onClick={() => onCopyDate(yesterday)}
        >
          Как вчера
        </Button>
      ) : null}
      {hasDayBefore ? (
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
      {named.map((meal) => (
        <div key={meal.id} className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-12 min-w-0 flex-1 text-base"
            disabled={busy}
            onClick={() => onApplyNamed(meal.id)}
          >
            <span className="truncate">{meal.name}</span>
          </Button>
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
        </div>
      ))}
      {otherDays.length > 0 ? (
        <Button
          type="button"
          variant="ghost"
          className="h-11 w-full text-base text-muted-foreground"
          disabled={busy}
          onClick={() => setPicking(true)}
        >
          Другой день
        </Button>
      ) : null}
      {hasItems ? (
        <Button
          type="button"
          variant="ghost"
          className="h-11 w-full text-base text-muted-foreground"
          disabled={busy}
          onClick={onSaveNamed}
        >
          Сохранить приём
        </Button>
      ) : null}
      {picking ? (
        <MealCopyDaySheet
          days={sources}
          yesterday={yesterday}
          dayBefore={dayBefore}
          onPick={(sourceDate) => {
            setPicking(false);
            onCopyDate(sourceDate);
          }}
          onCancel={() => setPicking(false)}
        />
      ) : null}
    </div>
  );
}
