"use client";

import { Plus, Type } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { MealDictateLink, MealPlateLink } from "@/components/day/meal-item-row";
import { TodayTextMealForm } from "@/components/day/today-text-meal-log";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SEGMENT =
  "flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground";

export function MealLogActions({
  addHref,
  addProminent = false,
  plateHref,
  dictateHref,
  textLog,
  className,
}: {
  addHref?: string;
  addProminent?: boolean;
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
  const sideCount =
    (plateHref ? 1 : 0) + (dictateHref ? 1 : 0) + (showText ? 1 : 0);
  if (!addHref && sideCount === 0) {
    return null;
  }

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      <div
        className={cn(
          "flex divide-x divide-border/80 overflow-hidden rounded-xl border border-border/90 bg-muted/25",
          addHref ? "w-full" : "w-fit",
          addProminent && addHref && "border-primary/35",
        )}
      >
        {addHref ? (
          <Link
            href={addHref}
            className={cn(
              "flex h-11 min-h-11 flex-1 items-center justify-center gap-1.5 px-3 text-sm font-medium whitespace-nowrap transition-colors",
              addProminent
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-foreground hover:bg-muted/50",
            )}
          >
            <Plus className="size-4 shrink-0" aria-hidden />
            Добавить
          </Link>
        ) : null}

        {plateHref ? (
          <MealPlateLink href={plateHref} compact segmentClassName={SEGMENT} />
        ) : null}
        {dictateHref ? (
          <MealDictateLink
            href={dictateHref}
            compact
            segmentClassName={SEGMENT}
          />
        ) : null}
        {showText ? (
          <Button
            type="button"
            variant="ghost"
            aria-label="Текстом"
            aria-pressed={textOpen}
            className={cn(
              SEGMENT,
              "rounded-none",
              textOpen && "bg-background text-foreground shadow-inner",
            )}
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
          embedded
          onDone={() => setTextOpen(false)}
        />
      ) : null}
    </div>
  );
}
