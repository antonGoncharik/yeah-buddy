"use client";

import { CookieDoodle, DumbbellDoodle } from "@/components/layout/doodles";
import { cn } from "@/lib/utils";

export function TodayDayMark({ training }: { training: boolean }) {
  return (
    <span
      className={cn(
        "relative h-7 shrink-0 text-primary",
        training ? "w-11" : "w-7",
      )}
      aria-hidden
    >
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-[var(--ease-out-soft)] motion-reduce:transition-none",
          training ? "opacity-0" : "opacity-100",
        )}
      >
        <CookieDoodle className="size-6" />
      </span>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-[var(--ease-out-soft)] motion-reduce:transition-none",
          training ? "opacity-100" : "opacity-0",
        )}
      >
        <DumbbellDoodle className="h-5 w-11" />
      </span>
    </span>
  );
}
