"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useEffect, useId, useMemo, useRef, useState } from "react";

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
      {hasYesterday ? (
        <Button
          type="button"
          variant={hasItems ? "outline" : "default"}
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
        <DayPickSheet
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

function DayPickSheet({
  days,
  yesterday,
  dayBefore,
  onPick,
  onCancel,
}: {
  days: CopyDayHint[];
  yesterday: string;
  dayBefore: string;
  onPick: (date: string) => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-[var(--app-chrome-bottom)] sm:items-center sm:pb-0">
      <button
        type="button"
        className="absolute inset-0 animate-fade bg-black/45"
        aria-label="Закрыть"
        onClick={onCancel}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="card-surface animate-rise relative z-10 mx-auto w-full max-w-lg rounded-t-[1.75rem] px-5 pt-3 pb-[calc(1.25rem+var(--app-safe-bottom))] outline-none sm:mb-10 sm:rounded-[1.75rem] sm:pt-6"
      >
        <div
          aria-hidden
          className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/25 sm:hidden"
        />
        <p id={titleId} className="text-lg font-medium leading-snug">
          С какого дня скопировать?
        </p>
        <div className="mt-5 flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
          {days.map((day) => (
            <Button
              key={day.date}
              type="button"
              variant="outline"
              className="h-12 w-full text-base"
              onClick={() => onPick(day.date)}
            >
              {copyDayLabel(day.date, yesterday, dayBefore)}
            </Button>
          ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          className="mt-2 h-12 w-full text-base"
          onClick={onCancel}
        >
          Отмена
        </Button>
      </div>
    </div>
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
