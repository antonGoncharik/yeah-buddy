"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { nutritionHistoryHref } from "@/lib/day/dates";
import { cn } from "@/lib/utils";

const linkClass = cn(
  buttonVariants({ variant: "outline", size: "touch" }),
  "h-auto whitespace-normal px-1.5 text-center text-sm leading-tight",
);

export function TodayDiaryLinks({ className }: { className?: string }) {
  return (
    <nav
      className={cn("grid grid-cols-3 gap-2", className)}
      aria-label="Дневник"
    >
      <Link href="/today/week" className={linkClass}>
        Неделя
      </Link>
      <Link href={nutritionHistoryHref()} className={linkClass}>
        История еды
      </Link>
      <Link href="/progress/ask" className={linkClass}>
        Спросить
      </Link>
    </nav>
  );
}
