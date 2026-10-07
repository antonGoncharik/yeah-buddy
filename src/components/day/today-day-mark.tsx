"use client";

import { CookieDoodle, DumbbellDoodle } from "@/components/layout/doodles";
import { cn } from "@/lib/utils";

export function TodayDayMark({ training }: { training: boolean }) {
  return (
    <span className="relative h-8 w-14 shrink-0 text-primary" aria-hidden>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-[var(--ease-out-soft)] motion-reduce:transition-none",
          training ? "opacity-0" : "opacity-100",
        )}
      >
        <CookieDoodle className="size-8" />
      </span>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-[var(--ease-out-soft)] motion-reduce:transition-none",
          training ? "opacity-100" : "opacity-0",
        )}
      >
        <DumbbellDoodle className="h-6 w-14" />
      </span>
    </span>
  );
}
