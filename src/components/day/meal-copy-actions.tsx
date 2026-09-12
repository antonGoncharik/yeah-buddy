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
  const [open, setOpen] = useState(false);
  const extras = useMealCopyExtras({
    date,
    mealType,
    copyDays,
    namedMeals,
  });

  if (!extras.hasAny) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="h-11 px-2 text-base text-muted-foreground"
        disabled={busy}
        onClick={() => setOpen(true)}
      >
        Ещё
      </Button>
      {open ? (
        <MealCopyDaySheet
          yesterday={extras.yesterday}
          dayBefore={extras.dayBefore}
          namedMeals={extras.named}
          hasYesterday={extras.hasYesterday}
          hasDayBefore={extras.hasDayBefore}
          hasItems={hasItems}
          busy={busy}
          onCopyDate={(sourceDate) => {
            setOpen(false);
            onCopyDate(sourceDate);
          }}
          onApplyNamed={(namedMealId) => {
            setOpen(false);
            onApplyNamed(namedMealId);
          }}
          onSaveNamed={
            hasItems
              ? () => {
                  setOpen(false);
                  onSaveNamed();
                }
              : undefined
          }
          onDeleteNamed={onDeleteNamed}
          onCancel={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function useMealCopyExtras({
  date,
  mealType,
  copyDays,
  namedMeals,
}: {
  date: string;
  mealType: MealType;
  copyDays: CopyDayHint[];
  namedMeals: NamedMealHint[];
}) {
  const yesterday = previousIsoDate(date);
  const dayBefore = previousIsoDate(yesterday);
  const named = namedMealsOfType(namedMeals, mealType);
  const sources = useMemo(
    () => copyDays.filter((day) => day.mealTypes.includes(mealType)),
    [copyDays, mealType],
  );
  const hasYesterday = sources.some((day) => day.date === yesterday);
  const hasDayBefore = sources.some((day) => day.date === dayBefore);

  return {
    yesterday,
    dayBefore,
    named,
    hasYesterday,
    hasDayBefore,
    hasAny: hasYesterday || hasDayBefore || named.length > 0,
  };
}
