"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { nextIsoDate, previousIsoDate } from "@/lib/day/dates";

export function TodayDateNav({
  date,
  canGoForward,
  onGoToDate,
}: {
  date: string;
  canGoForward: boolean;
  onGoToDate: (next: string) => void;
}) {
  return (
    <>
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
