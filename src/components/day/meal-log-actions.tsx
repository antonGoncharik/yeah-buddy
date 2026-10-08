"use client";

import { Plus, Type } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  mealActionBarClass,
  mealActionIconSegmentClass,
  mealActionPrimarySegmentClass,
} from "@/components/day/meal-action-bar";
import { MealDictateLink, MealPlateLink } from "@/components/day/meal-item-row";
import { TodayTextMealForm } from "@/components/day/today-text-meal-log";
import { Button } from "@/components/ui/button";
import { lumpHref } from "@/lib/day/lump";
import { cn } from "@/lib/utils";

export function MealLogActions({
  addHref,
  addProminent = false,
  lumpHrefBase,
  lumpQuery = "",
  plateHref,
  dictateHref,
  textLog,
  className,
}: {
  addHref?: string;
  addProminent?: boolean;
  lumpHrefBase?: string;
  lumpQuery?: string;
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
  const hasPrimary = Boolean(addHref || lumpHrefBase);
  const sideCount =
    (plateHref ? 1 : 0) + (dictateHref ? 1 : 0) + (showText ? 1 : 0);
  if (!hasPrimary && sideCount === 0) {
    return null;
  }
  const lumpLabel = lumpQuery.trim();

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      <div
        className={cn(
          mealActionBarClass,
          hasPrimary ? "w-full" : "w-fit",
          addProminent && addHref && "border-primary/35",
        )}
      >
        {addHref ? (
          <Link
            href={addHref}
            className={cn(
              mealActionPrimarySegmentClass,
              addProminent
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-foreground hover:bg-muted/50",
            )}
          >
            <Plus className="size-4 shrink-0" aria-hidden />
            Добавить
          </Link>
        ) : null}
        {lumpHrefBase && !addHref ? (
          <Link
            href={lumpHref(lumpHrefBase, lumpQuery)}
            className={cn(
              mealActionPrimarySegmentClass,
              "text-foreground hover:bg-muted/50",
            )}
          >
            {lumpLabel ? (
              `Записать «${lumpLabel}»`
            ) : (
              <>
                <Plus className="size-4 shrink-0" aria-hidden />
                Быстрая запись
              </>
            )}
          </Link>
        ) : null}

        {plateHref ? (
          <MealPlateLink
            href={plateHref}
            compact
            segmentClassName={mealActionIconSegmentClass}
          />
        ) : null}
        {dictateHref ? (
          <MealDictateLink
            href={dictateHref}
            compact
            segmentClassName={mealActionIconSegmentClass}
          />
        ) : null}
        {showText ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-label="Текстом"
            aria-pressed={textOpen}
            className={cn(
              mealActionIconSegmentClass,
              "rounded-none",
              textOpen && "bg-background text-foreground shadow-inner",
            )}
            onClick={() => setTextOpen((open) => !open)}
          >
            <Type aria-hidden />
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
