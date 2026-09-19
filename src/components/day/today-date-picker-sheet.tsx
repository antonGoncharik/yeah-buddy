"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { SheetFrame } from "@/components/layout/sheet-frame";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatIsoDate, formatYearMonth } from "@/lib/day/format";
import {
  canShiftYearMonthForward,
  clampYearMonth,
  monthGrid,
  shiftYearMonth,
  WEEKDAY_LABELS,
  yearMonthFromIso,
} from "@/lib/day/month-grid";
import { haptic } from "@/lib/telegram/haptic";
import { cn } from "@/lib/utils";

export function TodayDatePickerSheet({
  date,
  today,
  onSelect,
  onCancel,
}: {
  date: string;
  today: string;
  onSelect: (next: string) => void;
  onCancel: () => void;
}) {
  const [month, setMonth] = useState(() =>
    clampYearMonth(yearMonthFromIso(date), today),
  );
  const canNext = canShiftYearMonthForward(month, today);
  const cells = monthGrid(month, today);

  function goMonth(delta: number) {
    const next = shiftYearMonth(month, delta);
    if (delta > 0 && next > yearMonthFromIso(today)) {
      return;
    }
    haptic("tick");
    setMonth(next);
  }

  function pick(next: string) {
    if (next > today) {
      return;
    }
    haptic("tap");
    onSelect(next);
  }

  return (
    <SheetFrame label="Календарь" onCancel={onCancel}>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-xl text-foreground transition-[background-color,transform] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted active:scale-95"
          aria-label="Предыдущий месяц"
          onClick={() => goMonth(-1)}
        >
          <ChevronLeft className="size-6" />
        </button>
        <p className="min-w-0 flex-1 truncate text-center text-lg font-medium capitalize">
          {formatYearMonth(month)}
        </p>
        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-xl text-foreground transition-[background-color,transform] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted active:scale-95 disabled:opacity-30"
          aria-label="Следующий месяц"
          disabled={!canNext}
          onClick={() => {
            if (!canNext) {
              return;
            }
            goMonth(1);
          }}
        >
          <ChevronRight className="size-6" />
        </button>
      </div>

      <div className="grid grid-cols-7">
        {WEEKDAY_LABELS.map((label) => (
          <span
            key={label}
            className="py-1 text-center text-xs font-medium text-muted-foreground"
          >
            {label}
          </span>
        ))}
        {cells.map((cell) => {
          const selected = cell.date === date;
          const isToday = cell.date === today;
          return (
            <button
              key={cell.date}
              type="button"
              disabled={cell.disabled}
              aria-current={selected ? "date" : undefined}
              aria-label={formatIsoDate(cell.date, "d MMMM")}
              className={cn(
                "flex h-11 w-full items-center justify-center rounded-xl text-sm font-medium transition-[background-color,transform,color] duration-200 ease-[var(--ease-out-soft)] active:scale-95 disabled:pointer-events-none disabled:opacity-30",
                cell.inMonth ? "text-foreground" : "text-muted-foreground",
                selected
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
                isToday && !selected ? "ring-1 ring-primary/40" : null,
              )}
              onClick={() => pick(cell.date)}
            >
              {Number(cell.date.slice(8))}
            </button>
          );
        })}
      </div>

      <div className="mt-1 grid grid-cols-2 gap-2">
        <Link
          href="/today/week"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-12 text-base",
          )}
        >
          Неделя
        </Link>
        <Link
          href="/today/history"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-12 text-base",
          )}
        >
          История еды
        </Link>
      </div>

      {date === today ? null : (
        <Button
          type="button"
          variant="outline"
          className="mt-1 h-12 w-full text-base"
          onClick={() => pick(today)}
        >
          Сегодня
        </Button>
      )}
    </SheetFrame>
  );
}
