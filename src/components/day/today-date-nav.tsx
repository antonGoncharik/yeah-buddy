"use client";

import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  History,
} from "lucide-react";
import Link from "next/link";

import {
  nextIsoDate,
  nutritionWeekHref,
  previousIsoDate,
} from "@/lib/day/dates";

export function TodayDateNav({
  date,
  fromHistory,
  canGoForward,
  onGoToDate,
}: {
  date: string;
  fromHistory: boolean;
  canGoForward: boolean;
  onGoToDate: (next: string) => void;
}) {
  return (
    <>
      {fromHistory ? null : (
        <>
          <Link
            href="/today/history"
            className="flex size-11 items-center justify-center rounded-xl text-foreground transition-[background-color,transform] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted active:scale-95"
            aria-label="История еды"
          >
            <History className="size-5" />
          </Link>
          <Link
            href={nutritionWeekHref()}
            className="flex size-11 items-center justify-center rounded-xl text-foreground transition-[background-color,transform] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted active:scale-95"
            aria-label="Неделя"
          >
            <CalendarRange className="size-5" />
          </Link>
        </>
      )}
      <button
        type="button"
        className="flex size-11 items-center justify-center rounded-xl text-foreground transition-[background-color,transform] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted active:scale-95"
        aria-label="Предыдущий день"
        onClick={() => onGoToDate(previousIsoDate(date))}
      >
        <ChevronLeft className="size-6" />
      </button>
      <button
        type="button"
        className="flex size-11 items-center justify-center rounded-xl text-foreground transition-[background-color,transform] duration-200 ease-[var(--ease-out-soft)] hover:bg-muted active:scale-95 disabled:opacity-30"
        aria-label="Следующий день"
        disabled={!canGoForward}
        onClick={() => {
          if (!canGoForward) {
            return;
          }
          onGoToDate(nextIsoDate(date));
        }}
      >
        <ChevronRight className="size-6" />
      </button>
    </>
  );
}
