"use client";

import { Type } from "lucide-react";
import { useState } from "react";

import { MealDictateLink, MealPlateLink } from "@/components/day/meal-item-row";
import { TodayTextMealForm } from "@/components/day/today-text-meal-log";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MealQuickCapture({
  plateHref,
  dictateHref,
  textLog,
  className,
}: {
  plateHref?: string;
  dictateHref?: string;
  textLog?: {
    date: string;
    mealId: string;
    busy?: boolean;
  };
  className?: string;
}) {
  const [textOpen, setTextOpen] = useState(false);
  const showText = textLog != null;
  const showRow = Boolean(plateHref || dictateHref || showText);
  if (!showRow) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-2",
        textOpen ? "w-full flex-1" : "shrink-0",
        className,
      )}
    >
      <div className="flex shrink-0 gap-2">
        {plateHref ? <MealPlateLink href={plateHref} compact /> : null}
        {dictateHref ? <MealDictateLink href={dictateHref} compact /> : null}
        {showText ? (
          <Button
            type="button"
            variant={textOpen ? "secondary" : "outline"}
            aria-label="Текстом"
            className="size-12 shrink-0 rounded-xl px-0"
            onClick={() => setTextOpen((open) => !open)}
          >
            <Type className="size-4" aria-hidden />
          </Button>
        ) : null}
      </div>
      {textOpen && textLog ? (
        <TodayTextMealForm
          date={textLog.date}
          mealId={textLog.mealId}
          busy={textLog.busy ?? false}
          onDone={() => setTextOpen(false)}
        />
      ) : null}
    </div>
  );
}
