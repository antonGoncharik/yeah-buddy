"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";

import { SheetFrame } from "@/components/layout/sheet-frame";
import { Button } from "@/components/ui/button";
import type { CopyDayHint } from "@/lib/types";

export function MealCopyDaySheet({
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
  return (
    <SheetFrame title="С какого дня скопировать?" onCancel={onCancel}>
      <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
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
