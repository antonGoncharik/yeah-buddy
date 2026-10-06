"use client";

import Link from "next/link";

import { nutritionHistoryHref } from "@/lib/day/dates";
import { cn } from "@/lib/utils";

export function TodayDiaryLinks({ className }: { className?: string }) {
  return (
    <nav
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium",
        className,
      )}
      aria-label="Дневник"
    >
      <Link
        href="/today/week"
        className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Неделя
      </Link>
      <Link
        href={nutritionHistoryHref()}
        className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        История еды
      </Link>
    </nav>
  );
}
